## ADDED Requirements

### Requirement: Record model exploration with evidence states
The documentation system SHALL provide a model exploration review that records each model or experiment using one of four states: `待复跑`, `初步观察`, `已复现`, or `已否决`.

#### Scenario: Create a preliminary model record
- **WHEN** a model has been run but lacks a comparable reproduction
- **THEN** its record SHALL use `待复跑` or `初步观察` and SHALL NOT present a final adoption verdict

#### Scenario: Confirm an unadopted model
- **WHEN** a model has repeatable results under a documented protocol and a current decision not to use it
- **THEN** its record MAY use `已否决` and SHALL state the scope of that decision

### Requirement: Preserve reproduction context
Each model record SHALL include model/version/source, input asset, driving audio, output specification, hardware or resource context, key parameters, observed dimensions, comparison target, evidence path, current conclusion, and next step. Unknown fields SHALL be marked pending rather than inferred.

#### Scenario: Record an incomplete experiment
- **WHEN** hardware, input, or parameter details are unavailable
- **THEN** the record SHALL label those fields `待补` and SHALL limit its conclusion to the observed run

### Requirement: Require comparable conditions for ranking
The review SHALL treat model quality comparisons as comparable only when asset, driving audio, output specification, and resource budget are aligned or when each difference is explicitly stated.

#### Scenario: Compare a rerun against Avatar Forcing
- **WHEN** ExOmni-2D or MoDA is rerun using the same asset, driving audio, resolution/frame rate, and stated resource budget as Avatar Forcing
- **THEN** the review MAY compare observed quality and performance dimensions

#### Scenario: Record a non-comparable run
- **WHEN** a model run differs in one or more comparison conditions
- **THEN** the review SHALL list the differences and SHALL NOT present an overall stronger/weaker ranking

### Requirement: Seed pending ExOmni-2D and MoDA records
The review SHALL include pending rerun entries for ExOmni-2D and MoDA without fabricating metrics or final conclusions.

#### Scenario: View ExOmni-2D pending record
- **WHEN** the review is viewed before the user reruns ExOmni-2D
- **THEN** it SHALL show `待复跑`, the preliminary observation `输出偏糊`, and a same-protocol rerun as the next step

#### Scenario: View MoDA pending record
- **WHEN** the review is viewed before the user reruns MoDA
- **THEN** it SHALL show `待复跑`, the preliminary observation `可运行，当前主观上弱于 Avatar Forcing`, and a same-protocol rerun as the next step
