<script setup lang="ts">
import type { AllRolesMap, PermissionsRecord } from '@n8n/permissions';
import ProjectSharing from '@/components/Projects/ProjectSharing.vue';
import { useI18n } from '@n8n/i18n';
import type { ICredentialsDecryptedResponse, ICredentialsResponse } from '@/Interface';
import { useProjectsStore } from '@/stores/projects.store';
import { useRolesStore } from '@/stores/roles.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useUsersStore } from '@/stores/users.store';
import type { ProjectListItem, ProjectSharingData } from '@/types/projects.types';
import { ProjectTypes } from '@/types/projects.types';
import { splitName } from '@/utils/projects.utils';
import type { EventBus } from '@n8n/utils/event-bus';
import type { ICredentialDataDecryptedObject } from 'n8n-workflow';
import { computed, onMounted, ref, watch } from 'vue';

type Props = {
	credentialId: string;
	credentialData: ICredentialDataDecryptedObject;
	credentialPermissions: PermissionsRecord['credential'];
	credential?: ICredentialsResponse | ICredentialsDecryptedResponse | null;
	modalBus: EventBus;
};

const props = withDefaults(defineProps<Props>(), { credential: null });

const emit = defineEmits<{
	'update:modelValue': [value: ProjectSharingData[]];
}>();

const i18n = useI18n();

const usersStore = useUsersStore();
const settingsStore = useSettingsStore();
const projectsStore = useProjectsStore();
const rolesStore = useRolesStore();

const sharedWithProjects = ref([...(props.credential?.sharedWithProjects ?? [])]);

const credentialOwnerName = computed(() => {
	const { name, email } = splitName(props.credential?.homeProject?.name ?? '');
	return name ?? email ?? '';
});

const credentialDataHomeProject = computed<ProjectSharingData | undefined>(() => {
	const credentialContainsProjectSharingData = (
		data: ICredentialDataDecryptedObject,
	): data is { homeProject: ProjectSharingData } => {
		return 'homeProject' in data;
	};

	return props.credentialData && credentialContainsProjectSharingData(props.credentialData)
		? props.credentialData.homeProject
		: undefined;
});

const projects = computed<ProjectListItem[]>(() => {
	return projectsStore.projects.filter(
		(project) =>
			project.id !== props.credential?.homeProject?.id &&
			project.id !== credentialDataHomeProject.value?.id,
	);
});

const homeProject = computed<ProjectSharingData | undefined>(
	() => props.credential?.homeProject ?? credentialDataHomeProject.value,
);
const isHomeTeamProject = computed(() => homeProject.value?.type === ProjectTypes.Team);
const credentialRoleTranslations = computed<Record<string, string>>(() => {
	return {
		'credential:user': i18n.baseText('credentialEdit.credentialSharing.role.user'),
	};
});

const credentialRoles = computed<AllRolesMap['credential']>(() => {
	return rolesStore.processedCredentialRoles.map(
		({ slug, scopes, licensed, description, systemRole, roleType }) => ({
			slug,
			displayName: credentialRoleTranslations.value[slug],
			scopes,
			licensed,
			description,
			systemRole,
			roleType,
		}),
	);
});

const sharingSelectPlaceholder = computed(() =>
	projectsStore.teamProjects.length
		? i18n.baseText('projects.sharing.select.placeholder.project')
		: i18n.baseText('projects.sharing.select.placeholder.user'),
);

watch(
	sharedWithProjects,
	(changedSharedWithProjects) => {
		emit('update:modelValue', changedSharedWithProjects);
	},
	{ deep: true },
);

onMounted(async () => {
	await Promise.all([usersStore.fetchUsers(), projectsStore.getAllProjects()]);
});
</script>

<template>
	<div :class="$style.container">
		<N8nInfoTip v-if="credentialPermissions.share" :bold="false" class="mb-s">
			{{ i18n.baseText('credentialEdit.credentialSharing.info.owner') }}
		</N8nInfoTip>
		<N8nInfoTip v-else-if="isHomeTeamProject" :bold="false" class="mb-s">
			{{ i18n.baseText('credentialEdit.credentialSharing.info.sharee.team') }}
		</N8nInfoTip>
		<N8nInfoTip v-else :bold="false" class="mb-s">
			{{
				i18n.baseText('credentialEdit.credentialSharing.info.sharee.personal', {
					interpolate: { credentialOwnerName },
				})
			}}
		</N8nInfoTip>
		<ProjectSharing
			v-model="sharedWithProjects"
			:projects="projects"
			:roles="credentialRoles"
			:home-project="homeProject"
			:readonly="!credentialPermissions.share"
			:static="!credentialPermissions.share"
			:placeholder="sharingSelectPlaceholder"
		/>
	</div>
</template>

<style lang="scss" module>
.container {
	width: 100%;
	> * {
		margin-bottom: var(--spacing-l);
	}
}
</style>
