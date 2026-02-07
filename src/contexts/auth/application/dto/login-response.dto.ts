export class LoginResponseDto {
  constructor(
    public readonly token: string,
    public readonly user: {
      id: string;
      email: string;
      name?: string;
    },
  ) {}
}
