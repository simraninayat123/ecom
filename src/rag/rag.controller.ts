import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/strategies/types/jwt-payload.type.js';
import { AssistantService } from './assistant.service.js';
import { ChatDto } from './dto/chat.dto.js';
import { RecommendationDto } from './dto/recommendation.dto.js';
import { RagService } from './rag.service.js';

@Controller('rag')
@Throttle({ default: { limit: 20, ttl: 60_000 } })
export class RagController {
  constructor(
    private readonly ragService: RagService,
    private readonly assistantService: AssistantService,
  ) {}

  @Post('recommendations')
  @HttpCode(HttpStatus.OK)
  recommend(@Body() body: RecommendationDto) {
    return this.ragService.recommend(body.query, body.limit);
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard(['jwt', 'anonymous']))
  @ApiBearerAuth()
  chat(@CurrentUser() user: JwtPayload | undefined, @Body() body: ChatDto) {
    return this.assistantService.chat(
      body.message,
      body.history ?? [],
      user?.id ?? null,
    );
  }
}
