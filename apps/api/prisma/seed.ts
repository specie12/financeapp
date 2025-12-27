import { PrismaClient, AssetType, LiabilityType, CashFlowType, Frequency } from '@prisma/client'

const prisma = new PrismaClient()

// Fixed UUIDs for idempotent seeding
const DEMO_HOUSEHOLD_ID = '00000000-0000-0000-0000-000000000001'
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000002'
const DEMO_SCENARIO_ID = '00000000-0000-0000-0000-000000000003'

// Asset IDs
const ASSET_HOME_ID = '00000000-0000-0000-0001-000000000001'
const ASSET_CAR_ID = '00000000-0000-0000-0001-000000000002'
const ASSET_401K_ID = '00000000-0000-0000-0001-000000000003'
const ASSET_SAVINGS_ID = '00000000-0000-0000-0001-000000000004'
const ASSET_CRYPTO_ID = '00000000-0000-0000-0001-000000000005'

// Liability IDs
const LIABILITY_MORTGAGE_ID = '00000000-0000-0000-0002-000000000001'
const LIABILITY_CAR_LOAN_ID = '00000000-0000-0000-0002-000000000002'
const LIABILITY_CREDIT_CARD_ID = '00000000-0000-0000-0002-000000000003'

// Cash flow IDs
const CASHFLOW_SALARY_ID = '00000000-0000-0000-0003-000000000001'
const CASHFLOW_RENTAL_ID = '00000000-0000-0000-0003-000000000002'
const CASHFLOW_GROCERIES_ID = '00000000-0000-0000-0003-000000000003'
const CASHFLOW_UTILITIES_ID = '00000000-0000-0000-0003-000000000004'

async function main() {
  console.log('🌱 Starting seed...')

  // Create demo household
  const household = await prisma.household.upsert({
    where: { id: DEMO_HOUSEHOLD_ID },
    update: { name: 'Demo Household' },
    create: {
      id: DEMO_HOUSEHOLD_ID,
      name: 'Demo Household',
    },
  })
  console.log(`✅ Household: ${household.name}`)

  // Create demo user
  // Note: In production, password should be properly hashed
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {
      firstName: 'Demo',
      lastName: 'User',
      householdId: DEMO_HOUSEHOLD_ID,
    },
    create: {
      id: DEMO_USER_ID,
      email: 'demo@example.com',
      passwordHash: '$2b$10$demo.password.hash.placeholder',
      firstName: 'Demo',
      lastName: 'User',
      householdId: DEMO_HOUSEHOLD_ID,
    },
  })
  console.log(`✅ User: ${user.email}`)

  // Create sample assets
  const assets = [
    {
      id: ASSET_HOME_ID,
      name: 'Primary Residence',
      type: AssetType.real_estate,
      currentValueCents: 45000000, // $450,000
      annualGrowthRatePercent: 3.5,
    },
    {
      id: ASSET_CAR_ID,
      name: '2022 Honda Accord',
      type: AssetType.vehicle,
      currentValueCents: 2800000, // $28,000
      annualGrowthRatePercent: -15.0, // Depreciation
    },
    {
      id: ASSET_401K_ID,
      name: '401(k) Retirement',
      type: AssetType.retirement_account,
      currentValueCents: 15000000, // $150,000
      annualGrowthRatePercent: 7.0,
    },
    {
      id: ASSET_SAVINGS_ID,
      name: 'Emergency Fund',
      type: AssetType.bank_account,
      currentValueCents: 2500000, // $25,000
      annualGrowthRatePercent: 4.5, // High-yield savings
    },
    {
      id: ASSET_CRYPTO_ID,
      name: 'Bitcoin Holdings',
      type: AssetType.crypto,
      currentValueCents: 1000000, // $10,000
      annualGrowthRatePercent: null, // Volatile, no fixed rate
    },
  ]

  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { id: asset.id },
      update: {
        name: asset.name,
        type: asset.type,
        currentValueCents: asset.currentValueCents,
        annualGrowthRatePercent: asset.annualGrowthRatePercent,
      },
      create: {
        id: asset.id,
        householdId: DEMO_HOUSEHOLD_ID,
        name: asset.name,
        type: asset.type,
        currentValueCents: asset.currentValueCents,
        annualGrowthRatePercent: asset.annualGrowthRatePercent,
      },
    })
  }
  console.log(`✅ Assets: ${assets.length} created/updated`)

  // Create sample liabilities
  const liabilities = [
    {
      id: LIABILITY_MORTGAGE_ID,
      name: 'Home Mortgage',
      type: LiabilityType.mortgage,
      principalCents: 36000000, // $360,000 original
      currentBalanceCents: 32000000, // $320,000 remaining
      interestRatePercent: 6.5,
      minimumPaymentCents: 227500, // ~$2,275/month
      paymentFrequency: Frequency.monthly,
    },
    {
      id: LIABILITY_CAR_LOAN_ID,
      name: 'Auto Loan',
      type: LiabilityType.auto_loan,
      principalCents: 2500000, // $25,000 original
      currentBalanceCents: 1800000, // $18,000 remaining
      interestRatePercent: 5.9,
      minimumPaymentCents: 48300, // ~$483/month
      paymentFrequency: Frequency.monthly,
    },
    {
      id: LIABILITY_CREDIT_CARD_ID,
      name: 'Chase Sapphire',
      type: LiabilityType.credit_card,
      principalCents: 500000, // $5,000
      currentBalanceCents: 500000, // $5,000
      interestRatePercent: 24.99,
      minimumPaymentCents: 15000, // $150 minimum
      paymentFrequency: Frequency.monthly,
    },
  ]

  for (const liability of liabilities) {
    await prisma.liability.upsert({
      where: { id: liability.id },
      update: {
        name: liability.name,
        type: liability.type,
        principalCents: liability.principalCents,
        currentBalanceCents: liability.currentBalanceCents,
        interestRatePercent: liability.interestRatePercent,
        minimumPaymentCents: liability.minimumPaymentCents,
        paymentFrequency: liability.paymentFrequency,
      },
      create: {
        id: liability.id,
        householdId: DEMO_HOUSEHOLD_ID,
        name: liability.name,
        type: liability.type,
        principalCents: liability.principalCents,
        currentBalanceCents: liability.currentBalanceCents,
        interestRatePercent: liability.interestRatePercent,
        minimumPaymentCents: liability.minimumPaymentCents,
        paymentFrequency: liability.paymentFrequency,
      },
    })
  }
  console.log(`✅ Liabilities: ${liabilities.length} created/updated`)

  // Create sample cash flow items
  const cashFlowItems = [
    {
      id: CASHFLOW_SALARY_ID,
      name: 'Monthly Salary',
      type: CashFlowType.income,
      amountCents: 850000, // $8,500/month
      frequency: Frequency.monthly,
      annualGrowthRatePercent: 3.0, // Annual raises
    },
    {
      id: CASHFLOW_RENTAL_ID,
      name: 'Rental Income',
      type: CashFlowType.income,
      amountCents: 150000, // $1,500/month
      frequency: Frequency.monthly,
      annualGrowthRatePercent: 2.0,
    },
    {
      id: CASHFLOW_GROCERIES_ID,
      name: 'Groceries',
      type: CashFlowType.expense,
      amountCents: 80000, // $800/month
      frequency: Frequency.monthly,
      annualGrowthRatePercent: 3.5, // Inflation
    },
    {
      id: CASHFLOW_UTILITIES_ID,
      name: 'Utilities',
      type: CashFlowType.expense,
      amountCents: 30000, // $300/month
      frequency: Frequency.monthly,
      annualGrowthRatePercent: 2.5,
    },
  ]

  for (const item of cashFlowItems) {
    await prisma.cashFlowItem.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        type: item.type,
        amountCents: item.amountCents,
        frequency: item.frequency,
        annualGrowthRatePercent: item.annualGrowthRatePercent,
      },
      create: {
        id: item.id,
        householdId: DEMO_HOUSEHOLD_ID,
        name: item.name,
        type: item.type,
        amountCents: item.amountCents,
        frequency: item.frequency,
        annualGrowthRatePercent: item.annualGrowthRatePercent,
      },
    })
  }
  console.log(`✅ Cash Flow Items: ${cashFlowItems.length} created/updated`)

  // Create baseline scenario
  const scenario = await prisma.scenario.upsert({
    where: { id: DEMO_SCENARIO_ID },
    update: {
      name: 'Baseline',
      description: 'Current financial situation without changes',
      isBaseline: true,
    },
    create: {
      id: DEMO_SCENARIO_ID,
      householdId: DEMO_HOUSEHOLD_ID,
      name: 'Baseline',
      description: 'Current financial situation without changes',
      isBaseline: true,
    },
  })
  console.log(`✅ Scenario: ${scenario.name}`)

  console.log('🌱 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
