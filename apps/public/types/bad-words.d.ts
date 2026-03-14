declare module "bad-words" {
  class Filter {
    constructor(options?: {
      placeHolder?: string;
      regex?: RegExp;
      replaceRegex?: RegExp;
      splitRegex?: RegExp;
      wordRegex?: RegExp;
      list?: string[];
      exclude?: string[];
    });

    addWords(...words: string[]): void;
    removeWords(...words: string[]): void;
    isProfane(text: string): boolean;
    clean(text: string): string;
    replaceWord(text: string): string;
  }

  export default Filter;
}
