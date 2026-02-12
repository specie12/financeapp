import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { EncryptionService } from '../encryption/encryption.service'
import { PlanLimitsService } from '../plan-limits/plan-limits.service'
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid'
import type { ExchangeTokenDto } from './dto/exchange-token.dto'
import type { PlaidItem } from '@prisma/client'

@Injectable()
export class PlaidService {
  private plaidClient: PlaidApi

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly planLimitsService: PlanLimitsService,
  ) {
    const clientId = this.configService.get<string>('plaid.clientId')
    const secret = this.configService.get<string>('plaid.secret')
    const env = this.configService.get<string>('plaid.env') || 'sandbox'

    const plaidEnv =
      env === 'production'
        ? PlaidEnvironments.production
        : env === 'development'
          ? PlaidEnvironments.development
          : PlaidEnvironments.sandbox

    const configuration = new Configuration({
      basePath: plaidEnv,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': clientId,
          'PLAID-SECRET': secret,
        },
      },
    })

    this.plaidClient = new PlaidApi(configuration)
  }

  async createLinkToken(
    userId: string,
    householdId: string,
  ): Promise<{ linkToken: string; expiration: string }> {
    await this.planLimitsService.assertCanConnectPlaid(householdId)

    const response = await this.plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'Finance App',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    })

    return {
      linkToken: response.data.link_token,
      expiration: response.data.expiration,
    }
  }

  async exchangePublicToken(householdId: string, dto: ExchangeTokenDto): Promise<PlaidItem> {
    await this.planLimitsService.assertCanConnectPlaid(householdId)

    const response = await this.plaidClient.itemPublicTokenExchange({
      public_token: dto.publicToken,
    })

    const encryptedAccessToken = this.encryption.encrypt(response.data.access_token)

    return this.prisma.plaidItem.create({
      data: {
        householdId,
        itemId: response.data.item_id,
        accessToken: encryptedAccessToken,
        institutionId: dto.institutionId,
        institutionName: dto.institutionName,
        status: 'active',
      },
    })
  }

  async getItems(householdId: string): Promise<PlaidItem[]> {
    return this.prisma.plaidItem.findMany({
      where: { householdId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async syncTransactions(id: string, householdId: string): Promise<{ synced: number }> {
    const item = await this.prisma.plaidItem.findFirst({
      where: { id, householdId },
    })

    if (!item) {
      throw new NotFoundException('Plaid item not found')
    }

    const accessToken = this.encryption.decrypt(item.accessToken)

    let cursor = item.cursor || undefined
    let added = 0
    let hasMore = true

    while (hasMore) {
      const response = await this.plaidClient.transactionsSync({
        access_token: accessToken,
        cursor,
      })

      const { added: newTransactions, next_cursor, has_more } = response.data

      // Get the household's first user to associate transactions with
      const household = await this.prisma.household.findUnique({
        where: { id: householdId },
        include: { users: { take: 1 } },
      })

      if (!household || household.users.length === 0) {
        throw new BadRequestException('No user found for household')
      }

      const userId = household.users[0]!.id

      for (const txn of newTransactions) {
        // Find or create account
        let account = await this.prisma.account.findFirst({
          where: { plaidAccountId: txn.account_id },
        })

        if (!account) {
          account = await this.prisma.account.create({
            data: {
              userId,
              name: txn.account_id,
              type: 'checking',
              plaidAccountId: txn.account_id,
              plaidItemId: item.id,
            },
          })
        }

        // Upsert transaction
        await this.prisma.transaction.upsert({
          where: { plaidTransactionId: txn.transaction_id },
          create: {
            accountId: account.id,
            type: (txn.amount ?? 0) > 0 ? 'expense' : 'income',
            amount: Math.abs(Math.round((txn.amount ?? 0) * 100)),
            description: txn.name || 'Unknown',
            date: new Date(txn.date),
            plaidTransactionId: txn.transaction_id,
          },
          update: {
            amount: Math.abs(Math.round((txn.amount ?? 0) * 100)),
            description: txn.name || 'Unknown',
            date: new Date(txn.date),
          },
        })

        added++
      }

      cursor = next_cursor
      hasMore = has_more
    }

    // Update cursor and last synced timestamp
    await this.prisma.plaidItem.update({
      where: { id },
      data: {
        cursor,
        lastSyncedAt: new Date(),
      },
    })

    return { synced: added }
  }

  async deleteItem(id: string, householdId: string): Promise<void> {
    const item = await this.prisma.plaidItem.findFirst({
      where: { id, householdId },
    })

    if (!item) {
      throw new NotFoundException('Plaid item not found')
    }

    // Remove from Plaid
    try {
      const accessToken = this.encryption.decrypt(item.accessToken)
      await this.plaidClient.itemRemove({ access_token: accessToken })
    } catch {
      // Continue with local deletion even if Plaid API fails
    }

    await this.prisma.plaidItem.delete({ where: { id } })
  }

  async handleWebhook(itemId: string, webhookCode: string): Promise<void> {
    const item = await this.prisma.plaidItem.findUnique({
      where: { itemId },
    })

    if (!item) return

    switch (webhookCode) {
      case 'SYNC_UPDATES_AVAILABLE':
        await this.syncTransactions(item.id, item.householdId)
        break
      case 'ERROR':
        await this.prisma.plaidItem.update({
          where: { id: item.id },
          data: { status: 'error' },
        })
        break
      default:
        break
    }
  }
}
