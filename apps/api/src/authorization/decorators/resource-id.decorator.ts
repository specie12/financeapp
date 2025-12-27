import { SetMetadata } from '@nestjs/common'
import { type ResourceConfig } from '../interfaces/permission.interface'

export const RESOURCE_KEY = 'resource_config'

export const ResourceId = (config: ResourceConfig) => SetMetadata(RESOURCE_KEY, config)
