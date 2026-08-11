import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('components')
export class AppController {
  constructor(private readonly components: AppService) {}

  @Get()
  listComponents() {
    return { components: this.components.listComponents() };
  }

  @Get(':componentId')
  getComponent(@Param('componentId') componentId: string) {
    return { component: this.components.getComponent(componentId) };
  }
}
