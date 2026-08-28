import { LightningElement, api } from "lwc";

const SELECTED_CLASS = "case-card case-card_selected slds-button_reset";
const DEFAULT_CLASS = "case-card slds-button_reset";

export default class SenvoraCaseList extends LightningElement {
  _cases = [];
  _selectedCaseId;

  @api
  get cases() {
    return this._cases;
  }

  set cases(value) {
    this._cases = Array.isArray(value) ? value : [];
  }

  @api
  get selectedCaseId() {
    return this._selectedCaseId;
  }

  set selectedCaseId(value) {
    this._selectedCaseId = value;
  }

  get hasCases() {
    return this._cases.length > 0;
  }

  get caseItems() {
    return this._cases.map((caseItem) => {
      const isSelected = caseItem.id === this._selectedCaseId;
      return {
        ...caseItem,
        isSelected,
        className: isSelected ? SELECTED_CLASS : DEFAULT_CLASS
      };
    });
  }

  handleSelect(event) {
    this.dispatchCaseSelect(event.currentTarget.dataset.caseId);
  }

  dispatchCaseSelect(caseId) {
    this.dispatchEvent(new CustomEvent("caseselect", { detail: { caseId } }));
  }
}
