declare interface IPolMenuWebPartStrings {
  PropertyPaneDescription: string;
  ContentGroupName: string;
  HtmlFilePathFieldLabel: string;
  HtmlFilePathFieldDescription: string;
  TitleFieldLabel: string;
  AllowedHostsFieldLabel: string;
  AllowedHostsFieldDescription: string;
  AllowedHostsFieldError: string;
}

declare module 'PolMenuWebPartStrings' {
  const strings: IPolMenuWebPartStrings;
  export = strings;
}
