#!/usr/bin/env node
/**
 * Build n8n_qfai Docker image for private registry
 *
 * This script builds a custom n8n_qfai Docker image.
 * Default output: 'n8n_qfai:latest'
 * Override with IMAGE_BASE_NAME and IMAGE_TAG environment variables.
 */

import { $, echo, fs, chalk, os } from 'zx';
import { fileURLToPath } from 'url';
import path from 'path';

// Disable verbose mode for cleaner output
$.verbose = false;
process.env.FORCE_COLOR = '1';

// #region ===== Helper Functions =====

/**
 * Get Docker platform string based on host architecture
 * @returns {string} Platform string (e.g., 'linux/amd64')
 */
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

/**
 * Format duration in seconds
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
function formatDuration(ms) {
	return `${Math.floor(ms / 1000)}s`;
}

/**
 * Get Docker image size
 * @param {string} imageName - Full image name with tag
 * @returns {Promise<string>} Image size or 'Unknown'
 */
async function getImageSize(imageName) {
	try {
		const { stdout } = await $`docker images ${imageName} --format "{{.Size}}"`;
		return stdout.trim();
	} catch {
		return 'Unknown';
	}
}

/**
 * Check if a command exists
 * @param {string} command - Command to check
 * @returns {Promise<boolean>} True if command exists
 */
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
	imageBaseName: process.env.IMAGE_BASE_NAME || 'hamzaelkmntn/n8n_qfai',
	imageTag: process.env.IMAGE_TAG || 'latest',
	buildContext: rootDir,
	compiledAppDir: path.join(rootDir, 'compiled'),
	get fullImageName() {
		return `${this.imageBaseName}:${this.imageTag}`;
	},
};

// #region ===== Main Build Process =====

const platform = getDockerPlatform();

async function main() {
	echo(chalk.blue.bold('===== Docker Build for n8n_qfai ====='));
	echo(`INFO: Image: ${config.fullImageName}`);
	echo(`INFO: Platform: ${platform}`);
	echo(chalk.gray('-'.repeat(50)));

	await checkPrerequisites();

	// Build Docker image
	const buildTime = await buildDockerImage();

	// Get image details
	const imageSize = await getImageSize(config.fullImageName);

	// Display summary
	displaySummary({
		imageName: config.fullImageName,
		platform,
		size: imageSize,
		buildTime,
	});

	// Display push instructions
	displayPushInstructions(config.fullImageName);
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

async function buildDockerImage() {
	const startTime = Date.now();
	echo(chalk.yellow('INFO: Building n8n_qfai Docker image...'));

	try {
		const { stdout } = await $`docker build \
			--platform ${platform} \
			--build-arg TARGETPLATFORM=${platform} \
			--build-arg N8N_VERSION=1.110.0-qfai \
			-t ${config.fullImageName} \
			-f ${config.dockerfilePath} \
			--load \
			${config.buildContext}`;

		echo(stdout);
		return formatDuration(Date.now() - startTime);
	} catch (error) {
		echo(chalk.red(`ERROR: Docker build failed: ${error.stderr || error.message}`));
		process.exit(1);
	}
}

function displaySummary({ imageName, platform, size, buildTime }) {
	echo('');
	echo(chalk.green.bold('═'.repeat(60)));
	echo(chalk.green.bold('        n8n_qfai DOCKER BUILD COMPLETE'));
	echo(chalk.green.bold('═'.repeat(60)));
	echo(chalk.green(`✅ Image built: ${imageName}`));
	echo(`   Platform: ${platform}`);
	echo(`   Size: ${size}`);
	echo(`   Build time: ${buildTime}`);
	echo(chalk.green.bold('═'.repeat(60)));
}

function displayPushInstructions(imageName) {
	echo('');
	echo(chalk.cyan.bold('📋 Next Steps - Push to Docker Hub:'));
	echo(chalk.cyan('1. Login to Docker Hub:'));
	echo(chalk.white(`   docker login`));
	echo('');
	echo(chalk.cyan('2. Push to Docker Hub:'));
	echo(chalk.white(`   docker push ${imageName}`));
	echo('');
	echo(chalk.cyan('3. Update your other repo\'s docker-compose.yml:'));
	echo(chalk.white(`   image: ${imageName}`));
	echo('');
	echo(chalk.cyan('4. Your registry URL:'));
	echo(chalk.white(`   https://hub.docker.com/repository/docker/hamzaelkmntn/n8n_qfai`));
	echo('');
}

// #endregion ===== Main Build Process =====

main().catch((error) => {
	echo(chalk.red(`Unexpected error: ${error.message}`));
	process.exit(1);
});
