import { Source } from './source.vo';

describe('Source', () => {
  it('should create Source with valid value', () => {
    const source = new Source('amazon');
    expect(source.value).toBe('amazon');
  });

  it('should throw error when value is empty', () => {
    expect(() => new Source('')).toThrow('Source cannot be empty');
  });

  it('should throw error when value is only whitespace', () => {
    expect(() => new Source('   ')).toThrow('Source cannot be empty');
  });
});
