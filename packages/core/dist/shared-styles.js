import { css } from 'lit';
export const sharedStyles = css `
  .row {
    display: flex;
    flex-direction: row;
  }
  .column {
    display: flex;
    flex-direction: column;
  }

  .title {
    font-size: 20px;
  }
  .placeholder {
    color: rgba(0, 0, 0, 0.6);
  }

  :host {
    display: flex;
  }

  .flex-scrollable-parent {
    position: relative;
    display: flex;
    flex: 1;
  }
  .flex-scrollable-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  .flex-scrollable-x {
    max-width: 100%;
    overflow-x: auto;
  }
  .flex-scrollable-y {
    max-height: 100%;
    overflow-y: auto;
  }
`;
//# sourceMappingURL=shared-styles.js.map