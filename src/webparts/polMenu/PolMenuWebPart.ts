import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import PolMenu from './components/PolMenu';
import { IPolMenuProps } from './components/IPolMenuProps';

export interface IPolMenuWebPartProps {
  htmlFilePath: string;
  title: string;
}

export default class PolMenuWebPart extends BaseClientSideWebPart<IPolMenuWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public render(): void {
    const element: React.ReactElement<IPolMenuProps> = React.createElement(
      PolMenu,
      {
        htmlFilePath: this.properties.htmlFilePath,
        title: this.properties.title,
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    return this._getEnvironmentMessage().then((message: string) => {
      this._environmentMessage = message;
    });
  }

  private _getEnvironmentMessage(): Promise<string> {
    return Promise.resolve('Local SharePoint environment');
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: "PolMenu Web Part Configuration" },
          groups: [
            {
              groupName: "Content Options",
              groupFields: [
                PropertyPaneTextField('htmlFilePath', {
                  label: "HTML File URL"
                }),
                PropertyPaneTextField('title', {
                  label: "Title"
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
