#!/usr/bin/env node
/**
 * Build and Push n8n_qfai Docker image to Docker Hub
 *
 * This script builds the custom n8n_qfai Docker image and pushes it to Docker Hub.
 */

import { $, echo, fs, chalk, os } from 'zx';
import { fileURLToPath } from 'url';
import path from 'path';

// Disable verbose mode for cleaner output
$.verbose = false;
process.env.FORCE_COLOR = '1';

// #region ===== Helper Functions =====

function getDockerPlatform() {
	const arch = os.arch();
	const dockerArch = {
		x64: 'amd64',
		arm64: 'arm64',
	}[arch];

	if (!dockerArch) {
		throw new Error(`Unsupported architecture: ${arch}. Only x64 and arm64 are supported.`);
	}

	return `linux/${dockerArch}`;
}

function formatDuration(ms) {
	return `${Math.floor(ms / 1000)}s`;
}

async function commandExists(command) {
	try {
		await $`command -v ${command}`;
		return true;
	} catch {
		return false;
	}
}

// #endregion ===== Helper Functions =====

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isInScriptsDir = path.basename(__dirname) === 'scripts';
const rootDir = isInScriptsDir ? path.join(__dirname, '..') : __dirname;

const config = {
	dockerfilePath: path.join(rootDir, 'Dockerfile'),
	imageBaseName: 'hamzaelkmntn/n8n_qfai',
	imageTag: process.env.IMAGE_TAG || 'latest',
	buildContext: rootDir,
	compiledAppDir: path.join(rootDir, 'compiled'),
	get fullImageName() {
		return `${this.imageBaseName}:${this.imageTag}`;
	},
};

const platform = getDockerPlatform();

async function main() {
	echo(chalk.blue.bold('===== Build & Push n8n_qfai to Docker Hub ====='));
	echo(`INFO: Image: ${config.fullImageName}`);
	echo(`INFO: Platform: ${platform}`);
	echo(`INFO: Registry: https://hub.docker.com/repository/docker/hamzaelkmntn/n8n_qfai`);
	echo(chalk.gray('-'.repeat(60)));

	await checkPrerequisites();
	await checkDockerLogin();

	// Build and Push Docker image (multi-platform)
	const buildTime = await buildDockerImage();

	// Display summary
	displaySummary({
		imageName: config.fullImageName,
		platform: 'linux/amd64,linux/arm64',
		buildTime,
		pushTime: 'included in build',
	});
}

async function checkPrerequisites() {
	if (!(await fs.pathExists(config.compiledAppDir))) {
		echo(chalk.red(`Error: Compiled app directory not found at ${config.compiledAppDir}`));
		echo(chalk.yellow('Please run build-n8n.mjs first!'));
		process.exit(1);
	}

	if (!(await commandExists('docker'))) {
		echo(chalk.red('Error: Docker is not installed or not in PATH'));
		process.exit(1);
	}
}

async function checkDockerLogin() {
	echo(chalk.yellow('INFO: Assuming Docker Hub authentication is configured...'));
	echo(chalk.gray('(Skipping auth check due to Docker plugin warnings)'));
}

async function buildDockerImage() {
	const startTime = Date.now();
	echo(chalk.yellow('INFO: Building n8n_qfai Docker image for multi-platform...'));

	try {
		// Build for both amd64 and arm64 platforms
		await $`docker buildx build \
			--platform linux/amd64,linux/arm64 \
			--build-arg TARGETPLATFORM=linux/amd64 \
			--build-arg N8N_VERSION=1.110.0-qfai \
			-t ${config.fullImageName} \
			-f ${config.dockerfilePath} \
			--push \
			${config.buildContext}`;

		const buildTime = formatDuration(Date.now() - startTime);
		echo(chalk.green(`✓ Multi-platform build completed in ${buildTime}`));
		return buildTime;
	} catch (error) {
		echo(chalk.red(`ERROR: Docker build failed: ${error.stderr || error.message}`));
		process.exit(1);
	}
}

// Push is now included in the buildx command above

function displaySummary({ imageName, platform, buildTime, pushTime }) {
	echo('');
	echo(chalk.green.bold('═'.repeat(70)));
	echo(chalk.green.bold('        n8n_qfai BUILD & PUSH COMPLETE'));
	echo(chalk.green.bold('═'.repeat(70)));
	echo(chalk.green(`✅ Image: ${imageName}`));
	echo(`   Platform: ${platform}`);
	echo(`   Build time: ${buildTime}`);
	echo(`   Push time: ${pushTime}`);
	echo(`   Registry: https://hub.docker.com/repository/docker/hamzaelkmntn/n8n_qfai`);
	echo('');
	echo(chalk.cyan.bold('📋 Next Steps:'));
	echo(chalk.white('1. Update your other repo\'s docker-compose.yml:'));
	echo(chalk.white(`   image: ${imageName}`));
	echo('');
	echo(chalk.white('2. Pull and run in your other project:'));
	echo(chalk.white(`   docker-compose pull`));
	echo(chalk.white(`   docker-compose up -d`));
	echo(chalk.green.bold('═'.repeat(70)));
}

main().catch((error) => {
	echo(chalk.red(`Unexpected error: ${error.message}`));
	process.exit(1);
});
