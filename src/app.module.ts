import { Module } from '@nestjs/common';
import { AuthModule } from '@contexts/auth/infrastructure/auth.module';

@Module({
  imports: [AuthModule],
})
export class AppModule {}
