import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  IsNotEmpty,
} from 'class-validator'
import { Type } from 'class-transformer'

export enum OverrideTargetType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  CASH_FLOW_ITEM = 'cash_flow_item',
}

export class ScenarioOverrideDto {
  @IsEnum(OverrideTargetType)
  targetType: OverrideTargetType

  @IsString()
  @IsNotEmpty()
  entityId: string

  @IsString()
  @IsNotEmpty()
  fieldName: string

  @IsString()
  @IsNotEmpty()
  value: string
}

export class CreateScenarioDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsOptional()
  description?: string

  @IsBoolean()
  @IsOptional()
  isBaseline?: boolean

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScenarioOverrideDto)
  @IsOptional()
  overrides?: ScenarioOverrideDto[]
}
