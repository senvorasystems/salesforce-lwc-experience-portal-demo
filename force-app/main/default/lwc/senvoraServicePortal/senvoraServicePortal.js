import { LightningElement } from "lwc";

export default class SenvoraServicePortal extends LightningElement {
  selectedCaseId;

  handleCaseSelected(event) {
    this.selectedCaseId = event.detail.caseId;
  }

  handleCaseCreated() {
    const workspace = this.template.querySelector("c-senvora-case-workspace");
    workspace.refreshCases();
  }
}
