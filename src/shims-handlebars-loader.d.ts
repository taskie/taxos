declare module "*.hbs" {
  const contents: (o: any) => string;
  export = contents;
}
