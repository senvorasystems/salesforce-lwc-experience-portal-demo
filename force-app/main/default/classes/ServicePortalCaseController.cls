public with sharing class ServicePortalCaseController {
    private static final Integer MAX_SEARCH_TERM_LENGTH = 100;
    private static final Integer MAX_RESULTS = 50;

    @AuraEnabled(cacheable=true)
    public static List<CaseSummary> getCases(String searchTerm, String status, String priority) {
        String normalizedSearchTerm = normalizeOptionalValue(searchTerm);
        String normalizedStatus = normalizeOptionalValue(status);
        String normalizedPriority = normalizeOptionalValue(priority);

        if (normalizedSearchTerm != null && normalizedSearchTerm.length() > MAX_SEARCH_TERM_LENGTH) {
            throw invalidInput('Invalid search criteria.');
        }
        if (normalizedStatus != null && !getActivePicklistValues(Case.Status).contains(normalizedStatus)) {
            throw invalidInput('Invalid status filter.');
        }
        if (normalizedPriority != null && !getActivePicklistValues(Case.Priority).contains(normalizedPriority)) {
            throw invalidInput('Invalid priority filter.');
        }

        String searchPattern = normalizedSearchTerm == null ? null : '%' + escapeLikeValue(normalizedSearchTerm) + '%';

        List<Case> caseRecords;
        if (searchPattern != null && normalizedStatus != null && normalizedPriority != null) {
            caseRecords = [
                SELECT Id, CaseNumber, Subject, Status, Priority, CreatedDate
                FROM Case
                WHERE
                    (CaseNumber LIKE :searchPattern OR Subject LIKE :searchPattern)
                    AND Status = :normalizedStatus
                    AND Priority = :normalizedPriority
                WITH USER_MODE
                ORDER BY LastModifiedDate DESC, Id DESC
                LIMIT :MAX_RESULTS
            ];
        } else if (searchPattern != null && normalizedStatus != null) {
            caseRecords = [
                SELECT Id, CaseNumber, Subject, Status, Priority, CreatedDate
                FROM Case
                WHERE (CaseNumber LIKE :searchPattern OR Subject LIKE :searchPattern) AND Status = :normalizedStatus
                WITH USER_MODE
                ORDER BY LastModifiedDate DESC, Id DESC
                LIMIT :MAX_RESULTS
            ];
        } else if (searchPattern != null && normalizedPriority != null) {
            caseRecords = [
                SELECT Id, CaseNumber, Subject, Status, Priority, CreatedDate
                FROM Case
                WHERE (CaseNumber LIKE :searchPattern OR Subject LIKE :searchPattern) AND Priority = :normalizedPriority
                WITH USER_MODE
                ORDER BY LastModifiedDate DESC, Id DESC
                LIMIT :MAX_RESULTS
            ];
        } else if (normalizedStatus != null && normalizedPriority != null) {
            caseRecords = [
                SELECT Id, CaseNumber, Subject, Status, Priority, CreatedDate
                FROM Case
                WHERE Status = :normalizedStatus AND Priority = :normalizedPriority
                WITH USER_MODE
                ORDER BY LastModifiedDate DESC, Id DESC
                LIMIT :MAX_RESULTS
            ];
        } else if (searchPattern != null) {
            caseRecords = [
                SELECT Id, CaseNumber, Subject, Status, Priority, CreatedDate
                FROM Case
                WHERE CaseNumber LIKE :searchPattern OR Subject LIKE :searchPattern
                WITH USER_MODE
                ORDER BY LastModifiedDate DESC, Id DESC
                LIMIT :MAX_RESULTS
            ];
        } else if (normalizedStatus != null) {
            caseRecords = [
                SELECT Id, CaseNumber, Subject, Status, Priority, CreatedDate
                FROM Case
                WHERE Status = :normalizedStatus
                WITH USER_MODE
                ORDER BY LastModifiedDate DESC, Id DESC
                LIMIT :MAX_RESULTS
            ];
        } else if (normalizedPriority != null) {
            caseRecords = [
                SELECT Id, CaseNumber, Subject, Status, Priority, CreatedDate
                FROM Case
                WHERE Priority = :normalizedPriority
                WITH USER_MODE
                ORDER BY LastModifiedDate DESC, Id DESC
                LIMIT :MAX_RESULTS
            ];
        } else {
            caseRecords = [
                SELECT Id, CaseNumber, Subject, Status, Priority, CreatedDate
                FROM Case
                WITH USER_MODE
                ORDER BY LastModifiedDate DESC, Id DESC
                LIMIT :MAX_RESULTS
            ];
        }

        List<CaseSummary> summaries = new List<CaseSummary>();
        for (Case caseRecord : caseRecords) {
            summaries.add(new CaseSummary(caseRecord));
        }
        return summaries;
    }

    private static String normalizeOptionalValue(String value) {
        return String.isBlank(value) ? null : value.trim();
    }

    private static Set<String> getActivePicklistValues(Schema.SObjectField fieldToken) {
        Set<String> activeValues = new Set<String>();
        for (Schema.PicklistEntry entry : fieldToken.getDescribe().getPicklistValues()) {
            if (entry.isActive()) {
                activeValues.add(entry.getValue());
            }
        }
        return activeValues;
    }

    private static String escapeLikeValue(String value) {
        return value.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_');
    }

    private static AuraHandledException invalidInput(String message) {
        AuraHandledException handledException = new AuraHandledException(message);
        handledException.setMessage(message);
        return handledException;
    }

    public class CaseSummary {
        @AuraEnabled
        public Id id { get; set; }
        @AuraEnabled
        public String caseNumber { get; set; }
        @AuraEnabled
        public String subject { get; set; }
        @AuraEnabled
        public String status { get; set; }
        @AuraEnabled
        public String priority { get; set; }
        @AuraEnabled
        public Datetime createdDate { get; set; }

        private CaseSummary(Case caseRecord) {
            id = caseRecord.Id;
            caseNumber = caseRecord.CaseNumber;
            subject = caseRecord.Subject;
            status = caseRecord.Status;
            priority = caseRecord.Priority;
            createdDate = caseRecord.CreatedDate;
        }
    }
}
