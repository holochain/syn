import { css } from 'lit';

export const sharedStyles = css`
  .row {
    display: flex;
    flex-direction: row;
  }
  .column {
    display: flex;
    flex-direction: column;
  }

  .placeholder {
    color: rgba(0, 0, 0, 0.6);
  }
  :host {
    display: flex;
  }
`;
