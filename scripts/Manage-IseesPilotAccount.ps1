[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateSet('lookup', 'disable', 'enable', 'revoke')]
    [string] $Action,
    [Parameter(Mandatory)] [string] $Email,
    [string] $DatabasePath,
    [string] $PersistentRoot,
    [string] $ConfirmEmail,
    [ValidateSet('disable', 'enable', 'revoke')]
    [string] $ConfirmAction
)

$arguments = @('-m', 'isees_uap.operations.pilot_account', $Action, '--email', $Email)
if ($DatabasePath) { $arguments += @('--database-path', $DatabasePath) }
if ($PersistentRoot) { $arguments += @('--persistent-root', $PersistentRoot) }
if ($ConfirmEmail) { $arguments += @('--confirm-email', $ConfirmEmail) }
if ($ConfirmAction) { $arguments += @('--confirm-action', $ConfirmAction) }
& python @arguments
exit $LASTEXITCODE
