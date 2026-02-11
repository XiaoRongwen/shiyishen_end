declare module 'mammoth' {
  export interface ExtractRawTextResult {
    value: string;
    messages: any[];
  }

  export interface ExtractRawTextOptions {
    path?: string;
    buffer?: Buffer;
  }

  export function extractRawText(options: ExtractRawTextOptions): Promise<ExtractRawTextResult>;
}
