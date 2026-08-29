import { LightningElement } from "lwc";
import CASE_OBJECT from "@salesforce/schema/Case";
import SUBJECT_FIELD from "@salesforce/schema/Case.Subject";
import DESCRIPTION_FIELD from "@salesforce/schema/Case.Description";
import ORIGIN_FIELD from "@salesforce/schema/Case.Origin";
import PRIORITY_FIELD from "@salesforce/schema/Case.Priority";

export default class SenvoraCaseCreate extends LightningElement {
  caseObject = CASE_OBJECT;
  subjectField = SUBJECT_FIELD;
  descriptionField = DESCRIPTION_FIELD;
  originField = ORIGIN_FIELD;
  priorityField = PRIORITY_FIELD;

  isSubmitting = false;
  showSuccess = false;
  hasError = false;

  handleSubmit(event) {
    if (this.isSubmitting) {
      event.preventDefault();
      return;
    }

    this.isSubmitting = true;
    this.showSuccess = false;
    this.hasError = false;
  }

  handleSuccess(event) {
    this.isSubmitting = false;
    this.hasError = false;
    this.showSuccess = true;
    this.resetFields();
    this.dispatchEvent(
      new CustomEvent("casecreated", {
        detail: { caseId: event.detail.id }
      })
    );
  }

  handleError() {
    this.isSubmitting = false;
    this.showSuccess = false;
    this.hasError = true;
  }

  resetFields() {
    this.template
      .querySelectorAll("lightning-input-field")
      .forEach((field) => field.reset());
  }
}
