export interface LogoutUseCase {
  execute(token: string): Promise<void>;
}
