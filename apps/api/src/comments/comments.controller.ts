import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SanitizedUser } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { FindCommentsQueryDto } from './dto/find-comments-query.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // Público, como a leitura de Problem — ver a discussão não exige login.
  @Get()
  findByProblem(@Query() query: FindCommentsQueryDto) {
    return this.commentsService.findByProblem(query.problemId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateCommentDto, @CurrentUser() user: SanitizedUser) {
    return this.commentsService.create(dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: SanitizedUser,
  ) {
    return this.commentsService.remove(id, user.id);
  }
}
