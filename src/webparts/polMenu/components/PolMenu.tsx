import * as React from 'react';
import styles from './PolMenu.module.scss';
import { IPolMenuProps } from './IPolMenuProps';
import { resolveAllowedUrl, assertAllowedResponseOrigin, sanitizeHtml } from './htmlSource';

export interface IPolMenuState {
  htmlContent: string;
  error: string;
}

export default class PolMenu extends React.Component<IPolMenuProps, IPolMenuState> {
  private _abortController: AbortController | undefined;

  constructor(props: IPolMenuProps) {
    super(props);
    this.state = {
      htmlContent: '',
      error: ''
    };
  }

  public componentDidMount(): void {
    this.loadHtmlContent();
  }

  /**
   * SPFx re-renders into the same DOM node when a property changes, so React
   * reuses this instance and componentDidMount never fires again. Without this
   * hook, editing the URL in the property pane would not take effect until the
   * page was reloaded.
   */
  public componentDidUpdate(prevProps: IPolMenuProps): void {
    if (
      prevProps.htmlFilePath !== this.props.htmlFilePath ||
      prevProps.allowedHosts !== this.props.allowedHosts ||
      prevProps.pageOrigin !== this.props.pageOrigin
    ) {
      this.loadHtmlContent();
    }
  }

  public componentWillUnmount(): void {
    this.abortPendingRequest();
  }

  private abortPendingRequest(): void {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = undefined;
    }
  }

  private loadHtmlContent(): void {
    // Cancel any in-flight request so a slow earlier response cannot overwrite
    // the content of a newer one, and so nothing calls setState after unmount.
    this.abortPendingRequest();

    const { htmlFilePath, pageOrigin, allowedHosts } = this.props;

    if (!htmlFilePath) {
      this.setState({ htmlContent: '', error: '' });
      return;
    }

    let url: string;
    try {
      url = resolveAllowedUrl(htmlFilePath, pageOrigin, allowedHosts);
    } catch (error) {
      this.setState({ htmlContent: '', error: (error as Error).message });
      return;
    }

    const controller = new AbortController();
    this._abortController = controller;

    fetch(url, {
      signal: controller.signal,
      credentials: 'same-origin',
      redirect: 'follow'
    })
      .then(response => {
        if (!response.ok) {
          // Without this check a SharePoint 404 page would be injected as content.
          throw new Error(`Could not load the HTML file (HTTP ${response.status}).`);
        }
        assertAllowedResponseOrigin(response.url, pageOrigin, allowedHosts);
        return response.text();
      })
      .then(rawHtml => {
        if (controller.signal.aborted) {
          return;
        }
        this._abortController = undefined;
        this.setState({ htmlContent: sanitizeHtml(rawHtml), error: '' });
      })
      .catch(error => {
        if (controller.signal.aborted) {
          return;
        }
        this._abortController = undefined;
        this.setState({ htmlContent: '', error: (error as Error).message });
      });
  }

  public render(): React.ReactElement<IPolMenuProps> {
    const { htmlContent, error } = this.state;

    return (
      <div className={`${styles.polMenu} polMenuRoot`}>
        {this.props.title && <div className={styles.polMenuTitle}>{this.props.title}</div>}
        {error ? (
          // Rendered as text, never as markup.
          <div className={styles.polMenuError}>{error}</div>
        ) : (
          <div className={styles.polMenuContent} dangerouslySetInnerHTML={{ __html: htmlContent }} />
        )}
      </div>
    );
  }
}
