declare module 'gulp-zip' {
  declare namespace GulpZip {
    type GulpZipOptions = {
      /**
       * Compress
       * @default true
       */
      compress?: boolean | undefined;

      /**
       * Overrides the modification timestamp for all files added to the archive.
       *
       * Tip: Setting it to the same value across executions enables you to create stable archives
       * that change only when the contents of their entries change, regardless of whether those
       * entries were "touched" or regenerated.
       *
       * @default undefined
       */
      modifiedTime?: Date | undefined;

      buffer: boolean;
    };
  }

  declare function GulpZip(
    filename: string,
    options?: GulpZip.GulpZipOptions
  ): NodeJS.ReadStream;

  export = GulpZip;
}
