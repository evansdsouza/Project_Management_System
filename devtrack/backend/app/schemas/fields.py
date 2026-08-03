from typing import Annotated

from pydantic import StringConstraints

# Shared constraints for the required free-text identifiers.
#
# max_length mirrors the String(n) on the matching column: without it an
# over-long value reaches Postgres and surfaces as an uncaught 500 instead of
# a 422 the form can show inline. Keep the two in step.
#
# strip_whitespace + min_length together reject "" and "   ", which the bare
# `str` annotation accepted happily — a blank title renders as an empty row
# that can't be identified or searched for.

ProjectName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)
]

ItemTitle = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)
]
