import { IsString, IsObject } from 'class-validator';

export class SubmitResponseDto {
  @IsString()
  surveyId: string;

  @IsObject()
  answers: Record<string, any>; // { questionId: answer }
}
