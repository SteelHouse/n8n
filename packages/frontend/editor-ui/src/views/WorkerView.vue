<script setup lang="ts">
import WorkerList from '@/components/WorkerList.ee.vue';
import { useSettingsStore } from '@/stores/settings.store';
import { usePageRedirectionHelper } from '@/composables/usePageRedirectionHelper';
import { useI18n } from '@n8n/i18n';

const settingsStore = useSettingsStore();
const pageRedirectionHelper = usePageRedirectionHelper();
const i18n = useI18n();

const goToUpgrade = () => {
	void pageRedirectionHelper.goToUpgrade('worker-view', 'upgrade-worker-view');
};
</script>

<template>
	<WorkerList
		v-if="settingsStore.isQueueModeEnabled"
		data-test-id="worker-view-licensed"
	/>
	<div v-else :class="$style.actionBox">
		<n8n-callout theme="info">
			{{ i18n.baseText('workerList.actionBox.description') }}
			<a :href="i18n.baseText('workerList.docs.url')" target="_blank">
				{{ i18n.baseText('workerList.actionBox.description.link') }}
			</a>
		</n8n-callout>
	</div>
</template>

<style module lang="scss">
.actionBox {
	margin: var(--spacing-2xl) 0 0;
}
</style>
