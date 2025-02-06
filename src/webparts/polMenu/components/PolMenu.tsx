import * as React from 'react';
import styles from './PolMenu.module.scss';
import { IPolMenuProps } from './IPolMenuProps';

export interface IPolMenuState {
  htmlContent: string;
}

export default class PolMenu extends React.Component<IPolMenuProps, IPolMenuState> {
  constructor(props: IPolMenuProps) {
    super(props);
    this.state = {
      htmlContent: ''
    };
  }

  public componentDidMount(): void {
    this.loadHtmlContent();
  }

  private loadHtmlContent(): void {
    if (this.props.htmlFilePath) {
      fetch(this.props.htmlFilePath)
        .then(response => response.text())
        .then(htmlContent => {
          this.setState({ htmlContent });
        })
        .catch(error => {
          console.error('Error loading HTML content:', error);
        });
    }
  }

  public render(): React.ReactElement<IPolMenuProps> {
    return (
      <div className={`${styles.polMenu} polMenuRoot`}>
        {this.props.title && <div className={styles.polMenuTitle}>{this.props.title}</div>}
        <div className={styles.polMenuContent} dangerouslySetInnerHTML={{ __html: this.state.htmlContent }} />
      </div>
    );
  }
}
