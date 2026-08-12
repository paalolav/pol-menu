import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as strings from 'PolMenuWebPartStrings';

import PolMenu from './components/PolMenu';
import { IPolMenuProps } from './components/IPolMenuProps';
import { resolveAllowedUrl, parseAllowedHosts } from './components/htmlSource';

export interface IPolMenuWebPartProps {
  htmlFilePath: string;
  title: string;
  allowedHosts: string;
}

export default class PolMenuWebPart extends BaseClientSideWebPart<IPolMenuWebPartProps> {

  public render(): void {
    const element: React.ReactElement<IPolMenuProps> = React.createElement(
      PolMenu,
      {
        htmlFilePath: this.properties.htmlFilePath,
        title: this.properties.title,
        pageOrigin: this.context.pageContext.web.absoluteUrl,
        allowedHosts: this.properties.allowedHosts
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.1');
  }

  /**
   * Surfaces the same source restrictions the component enforces at fetch time,
   * so an author sees the problem while editing rather than as a broken web part.
   */
  private _validateHtmlFilePath = (value: string): string => {
    if (!value || value.trim().length === 0) {
      return '';
    }

    try {
      resolveAllowedUrl(value, this.context.pageContext.web.absoluteUrl, this.properties.allowedHosts);
      return '';
    } catch (error) {
      return (error as Error).message;
    }
  };

  private _validateAllowedHosts = (value: string): string => {
    if (!value || value.trim().length === 0) {
      return '';
    }

    const entries = value.split(',').map(entry => entry.trim()).filter(entry => entry.length > 0);
    const parsed = parseAllowedHosts(value);

    if (parsed.length !== entries.length) {
      return strings.AllowedHostsFieldError;
    }

    return '';
  };

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: strings.PropertyPaneDescription },
          groups: [
            {
              groupName: strings.ContentGroupName,
              groupFields: [
                PropertyPaneTextField('htmlFilePath', {
                  label: strings.HtmlFilePathFieldLabel,
                  description: strings.HtmlFilePathFieldDescription,
                  onGetErrorMessage: this._validateHtmlFilePath,
                  deferredValidationTime: 500
                }),
                PropertyPaneTextField('title', {
                  label: strings.TitleFieldLabel
                }),
                PropertyPaneTextField('allowedHosts', {
                  label: strings.AllowedHostsFieldLabel,
                  description: strings.AllowedHostsFieldDescription,
                  onGetErrorMessage: this._validateAllowedHosts,
                  deferredValidationTime: 500
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
