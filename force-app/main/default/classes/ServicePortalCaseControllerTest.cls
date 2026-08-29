@IsTest
private class ServicePortalCaseControllerTest {
    private static final Integer SEEDED_CASE_COUNT = 55;

    @TestSetup
    static void setupCases() {
        String openStatus = firstActiveValue(Case.Status);
        String defaultPriority = firstActiveValue(Case.Priority);
        String defaultOrigin = firstActiveValue(Case.Origin);
        List<Case> casesToInsert = new List<Case>();

        for (Integer index = 0; index < SEEDED_CASE_COUNT; index++) {
            casesToInsert.add(
                new Case(
                    Subject = 'Senvora seeded case ' + index,
                    Status = openStatus,
                    Priority = defaultPriority,
                    Origin = defaultOrigin
                )
            );
        }
        casesToInsert.add(
            new Case(
                Subject = 'Literal percent % marker',
                Status = openStatus,
                Priority = defaultPriority,
                Origin = defaultOrigin
            )
        );
        casesToInsert.add(
            new Case(
                Subject = 'Literal underscore _ marker',
                Status = openStatus,
                Priority = defaultPriority,
                Origin = defaultOrigin
            )
        );
        insert casesToInsert;
    }

    @IsTest
    static void noFiltersReturnsMultipleCasesWithinLimit() {
        Test.startTest();
        List<ServicePortalCaseController.CaseSummary> results = ServicePortalCaseController.getCases(null, null, null);
        Test.stopTest();

        Assert.areEqual(50, results.size(), 'The query must enforce its maximum result count.');
        Assert.isTrue(results.size() > 1, 'Multiple accessible Cases should be returned.');
    }

    @IsTest
    static void resultsUseStableOrdering() {
        List<Case> expected = [
            SELECT Id
            FROM Case
            WITH USER_MODE
            ORDER BY LastModifiedDate DESC, Id DESC
            LIMIT 50
        ];

        List<ServicePortalCaseController.CaseSummary> firstCall = ServicePortalCaseController.getCases(null, null, null);
        List<ServicePortalCaseController.CaseSummary> secondCall = ServicePortalCaseController.getCases(null, null, null);

        Assert.areEqual(expected.size(), firstCall.size());
        for (Integer index = 0; index < expected.size(); index++) {
            Assert.areEqual(expected[index].Id, firstCall[index].id, 'Results should follow the documented ordering.');
            Assert.areEqual(firstCall[index].id, secondCall[index].id, 'Repeated calls should preserve ordering.');
        }
    }

    @IsTest
    static void searchesByCaseNumber() {
        Case target = [SELECT Id, CaseNumber FROM Case WHERE Subject = 'Senvora seeded case 7' LIMIT 1];

        List<ServicePortalCaseController.CaseSummary> results = ServicePortalCaseController.getCases(
            target.CaseNumber,
            null,
            null
        );

        Assert.areEqual(1, results.size());
        Assert.areEqual(target.Id, results[0].id);
    }

    @IsTest
    static void searchesByPartialSubject() {
        List<ServicePortalCaseController.CaseSummary> results = ServicePortalCaseController.getCases(
            'seeded case 23',
            null,
            null
        );

        Assert.areEqual(1, results.size());
        Assert.areEqual('Senvora seeded case 23', results[0].subject);
    }

    @IsTest
    static void filtersByStatus() {
        List<String> statuses = activeValues(Case.Status);
        String targetStatus = statuses.size() > 1 ? statuses[1] : statuses[0];
        Case target = [SELECT Id FROM Case WHERE Subject = 'Senvora seeded case 1' LIMIT 1];
        target.Status = targetStatus;
        update target;

        List<ServicePortalCaseController.CaseSummary> results = ServicePortalCaseController.getCases(null, targetStatus, null);

        Assert.isFalse(results.isEmpty(), 'The active Status filter should return matching Cases.');
        Boolean foundTarget = false;
        for (ServicePortalCaseController.CaseSummary result : results) {
            Assert.areEqual(targetStatus, result.status);
            foundTarget = foundTarget || result.id == target.Id;
        }
        Assert.isTrue(foundTarget, 'The specifically prepared Case should be returned.');
    }

    @IsTest
    static void filtersByPriority() {
        List<String> priorities = activeValues(Case.Priority);
        String targetPriority = priorities.size() > 1 ? priorities[1] : priorities[0];
        Case target = [SELECT Id FROM Case WHERE Subject = 'Senvora seeded case 2' LIMIT 1];
        target.Priority = targetPriority;
        update target;

        List<ServicePortalCaseController.CaseSummary> results = ServicePortalCaseController.getCases(null, null, targetPriority);

        Assert.isFalse(results.isEmpty(), 'The active Priority filter should return matching Cases.');
        Boolean foundTarget = false;
        for (ServicePortalCaseController.CaseSummary result : results) {
            Assert.areEqual(targetPriority, result.priority);
            foundTarget = foundTarget || result.id == target.Id;
        }
        Assert.isTrue(foundTarget, 'The specifically prepared Case should be returned.');
    }

    @IsTest
    static void combinesSearchAndStatusFilters() {
        String status = firstActiveValue(Case.Status);

        List<ServicePortalCaseController.CaseSummary> results = ServicePortalCaseController.getCases(
            'seeded case 11',
            status,
            null
        );

        Assert.areEqual(1, results.size());
        Assert.areEqual('Senvora seeded case 11', results[0].subject);
        Assert.areEqual(status, results[0].status);
    }

    @IsTest
    static void combinesSearchAndPriorityFilters() {
        String priority = firstActiveValue(Case.Priority);

        List<ServicePortalCaseController.CaseSummary> results = ServicePortalCaseController.getCases(
            'seeded case 12',
            null,
            priority
        );

        Assert.areEqual(1, results.size());
        Assert.areEqual('Senvora seeded case 12', results[0].subject);
        Assert.areEqual(priority, results[0].priority);
    }

    @IsTest
    static void combinesStatusAndPriorityFilters() {
        String status = firstActiveValue(Case.Status);
        String priority = firstActiveValue(Case.Priority);

        List<ServicePortalCaseController.CaseSummary> results = ServicePortalCaseController.getCases(
            null,
            status,
            priority
        );

        Assert.isFalse(results.isEmpty(), 'Combined active filters should return matching Cases.');
        for (ServicePortalCaseController.CaseSummary result : results) {
            Assert.areEqual(status, result.status);
            Assert.areEqual(priority, result.priority);
        }
    }

    @IsTest
    static void combinesSearchStatusAndPriorityFilters() {
        String status = firstActiveValue(Case.Status);
        String priority = firstActiveValue(Case.Priority);

        List<ServicePortalCaseController.CaseSummary> results = ServicePortalCaseController.getCases(
            'seeded case 31',
            status,
            priority
        );

        Assert.areEqual(1, results.size());
        Assert.areEqual('Senvora seeded case 31', results[0].subject);
    }

    @IsTest
    static void returnsZeroResultsForNoMatch() {
        List<ServicePortalCaseController.CaseSummary> results = ServicePortalCaseController.getCases(
            'value-that-does-not-exist',
            null,
            null
        );

        Assert.areEqual(0, results.size());
    }

    @IsTest
    static void treatsBlankFiltersAsNoFilters() {
        List<ServicePortalCaseController.CaseSummary> nullResults = ServicePortalCaseController.getCases(null, null, null);
        List<ServicePortalCaseController.CaseSummary> blankResults = ServicePortalCaseController.getCases('   ', ' ', '\t');

        Assert.areEqual(nullResults.size(), blankResults.size());
        for (Integer index = 0; index < nullResults.size(); index++) {
            Assert.areEqual(nullResults[index].id, blankResults[index].id);
        }
    }

    @IsTest
    static void rejectsSearchTermsOverMaximumLength() {
        assertInvalidInput('x'.leftPad(101, 'x'), null, null, 'Invalid search criteria.');
    }

    @IsTest
    static void rejectsInvalidStatus() {
        assertInvalidInput(null, 'Not a real status', null, 'Invalid status filter.');
    }

    @IsTest
    static void rejectsInvalidPriority() {
        assertInvalidInput(null, null, 'Not a real priority', 'Invalid priority filter.');
    }

    @IsTest
    static void treatsPercentAsLiteralText() {
        List<ServicePortalCaseController.CaseSummary> results = ServicePortalCaseController.getCases('%', null, null);

        Assert.areEqual(1, results.size(), 'Percent must not behave as a LIKE wildcard.');
        Assert.areEqual('Literal percent % marker', results[0].subject);
    }

    @IsTest
    static void treatsUnderscoreAsLiteralText() {
        List<ServicePortalCaseController.CaseSummary> results = ServicePortalCaseController.getCases('_', null, null);

        Assert.areEqual(1, results.size(), 'Underscore must not behave as a LIKE wildcard.');
        Assert.areEqual('Literal underscore _ marker', results[0].subject);
    }

    @IsTest
    static void mapsOnlyExpectedDtoValues() {
        Case expected = [
            SELECT Id, CaseNumber, Subject, Status, Priority, CreatedDate
            FROM Case
            WHERE Subject = 'Senvora seeded case 42'
            LIMIT 1
        ];

        ServicePortalCaseController.CaseSummary actual = ServicePortalCaseController.getCases(
            'seeded case 42',
            null,
            null
        )[0];

        Assert.areEqual(expected.Id, actual.id);
        Assert.areEqual(expected.CaseNumber, actual.caseNumber);
        Assert.areEqual(expected.Subject, actual.subject);
        Assert.areEqual(expected.Status, actual.status);
        Assert.areEqual(expected.Priority, actual.priority);
        Assert.areEqual(expected.CreatedDate, actual.createdDate);
    }

    private static void assertInvalidInput(String searchTerm, String status, String priority, String expectedMessage) {
        try {
            ServicePortalCaseController.getCases(searchTerm, status, priority);
            Assert.fail('Expected invalid input to be rejected.');
        } catch (AuraHandledException caughtException) {
            Assert.areEqual(expectedMessage, caughtException.getMessage());
        }
    }

    private static String firstActiveValue(Schema.SObjectField fieldToken) {
        return activeValues(fieldToken)[0];
    }

    private static List<String> activeValues(Schema.SObjectField fieldToken) {
        List<String> values = new List<String>();
        for (Schema.PicklistEntry entry : fieldToken.getDescribe().getPicklistValues()) {
            if (entry.isActive()) {
                values.add(entry.getValue());
            }
        }
        return values;
    }
}
