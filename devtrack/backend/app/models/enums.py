import enum


class RequirementStatus(str, enum.Enum):
    NOT_STARTED = "Not Started"
    IN_PROGRESS = "In Progress"
    DONE = "Done"


class BugStatus(str, enum.Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    PARTIAL_FIX = "Partial Fix"
    FIXED = "Fixed"


class Priority(str, enum.Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class BacklogStatus(str, enum.Enum):
    IN_BACKLOG = "In Backlog"
    ACTIVE = "Active"


class BugType(str, enum.Enum):
    LOGIC_ERROR = "Logic Error"
    SYSTEM_ERROR = "System Error"
    BOTH = "Both"
