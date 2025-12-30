import {
  IsArray,
  IsString,
  IsInt,
  IsOptional,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator'

export class CompareScenariosDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  scenarioIds!: string[]

  @IsInt()
  @Min(1)
  @Max(30)
  @IsOptional()
  horizonYears?: number
}
