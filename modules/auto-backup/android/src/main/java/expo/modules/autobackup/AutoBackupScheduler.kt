package expo.modules.autobackup

import android.content.Context
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequest
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import java.time.Duration
import java.time.ZonedDateTime
import java.util.concurrent.TimeUnit

/**
 * One run a day, at a time the user picked.
 *
 * A one-off request that each run re-arms, not a PeriodicWorkRequest: periodic
 * work is anchored to when it was enqueued and drifts off the time of day.
 * Exact alarms would keep to it, but they need SCHEDULE_EXACT_ALARM, which
 * Play keeps for alarm and calendar apps. Doze can push a run to its next
 * maintenance window, so it's "at or a little after", plenty for a backup.
 */
internal object AutoBackupScheduler {
  private const val WORK_NAME = "code-scanner-auto-backup"

  /**
   * Idempotent: JS calls this on every start, including the start a run
   * causes, and replacing then would cancel that very run. The work is only
   * replaced when the time changed.
   */
  fun schedule(context: Context, hour: Int, minute: Int) {
    val minuteOfDay = hour * 60 + minute
    val policy =
      if (AutoBackupState.minuteOfDay(context) == minuteOfDay) ExistingWorkPolicy.KEEP
      else ExistingWorkPolicy.REPLACE
    AutoBackupState.setMinuteOfDay(context, minuteOfDay)
    WorkManager.getInstance(context)
      .enqueueUniqueWork(WORK_NAME, policy, request(minuteOfDay))
  }

  /**
   * Called from inside the running worker. REPLACE would cancel the run doing
   * it, so the next one is appended behind it; that's also why the worker never
   * reports failure, which would fail the appended run and end the chain.
   */
  fun scheduleNextFromWorker(context: Context) {
    val minuteOfDay = AutoBackupState.minuteOfDay(context) ?: return
    WorkManager.getInstance(context).enqueueUniqueWork(
      WORK_NAME,
      ExistingWorkPolicy.APPEND_OR_REPLACE,
      request(minuteOfDay),
    )
  }

  fun cancel(context: Context) {
    AutoBackupState.setMinuteOfDay(context, null)
    WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
  }

  private fun request(minuteOfDay: Int): OneTimeWorkRequest =
    OneTimeWorkRequestBuilder<AutoBackupWorker>()
      .setInitialDelay(delayUntil(minuteOfDay), TimeUnit.MILLISECONDS)
      .setConstraints(
        Constraints.Builder()
          .setRequiresBatteryNotLow(true)
          .setRequiresStorageNotLow(true)
          .build(),
      )
      .build()

  // The minute of margin keeps a run that ends just before its own slot from
  // being re-armed for that same slot.
  internal fun delayUntil(minuteOfDay: Int, now: ZonedDateTime = ZonedDateTime.now()): Long {
    var next = now
      .withHour(minuteOfDay / 60)
      .withMinute(minuteOfDay % 60)
      .withSecond(0)
      .withNano(0)
    if (!next.isAfter(now.plusMinutes(1))) next = next.plusDays(1)
    return Duration.between(now, next).toMillis()
  }
}
