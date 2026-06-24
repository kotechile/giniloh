import React, { useState, useMemo, useEffect } from 'react';
import { formatCurrency } from '../../../lib/calculators/format';

interface GpuModel {
	id: string;
	name: string;
	cost: number;
	tdp: number; // in Watts
	vram: string;
	tier: string;
	isTurnKey: boolean;
}

interface CloudGpuConfig {
	gpuModel: string;
	vram: string;
	rate: number;
	communityRate?: number;
	spotRate?: number;
	note?: string;
}

interface CloudProviderDetail {
	id: string;
	name: string;
	description: string;
	billingUnit: string;
	egress: string;
	storageCost: string;
	storageRate: number; // storage rate per GB/month
	affiliateUrl: string;
	ctaText?: string;
	type: 'Enterprise' | 'Decentralized' | 'Standard';
	gpus: CloudGpuConfig[];
}

const GPU_MODELS: GpuModel[] = [
	// TIER 1: Apple Silicon (Unified Memory)
	{ id: 'mac-mini-m4-pro-48', name: 'Mac Mini M4 Pro (48GB) - $1,499', cost: 1499, tdp: 65, vram: '48GB', tier: 'Apple Silicon', isTurnKey: true },
	{ id: 'mac-mini-m4-pro-64', name: 'Mac Mini M4 Pro (64GB) - $1,799', cost: 1799, tdp: 65, vram: '64GB', tier: 'Apple Silicon', isTurnKey: true },
	{ id: 'mac-studio-m4-max-128', name: 'Mac Studio M4 Max (128GB) - $3,699', cost: 3699, tdp: 120, vram: '128GB', tier: 'Apple Silicon', isTurnKey: true },

	// TIER 2: AMD Mini PCs (Budget Always-On)
	{ id: 'beelink-ser9-64', name: 'Beelink SER9 (64GB DDR5) - $799', cost: 799, tdp: 25, vram: '64GB Shared', tier: 'AMD Mini PC', isTurnKey: true },
	{ id: 'gmktec-evo-x2-128', name: 'GMKtec EVO-X2 (AMD Strix Halo 128GB) - $2,849', cost: 2849, tdp: 85, vram: '128GB Shared', tier: 'AMD Mini PC', isTurnKey: true },

	// TIER 3: Professional CUDA Powerhouse
	{ id: 'rtx-5090-diy', name: 'Custom RTX 5090 DIY Workstation (32GB VRAM) - $7,500', cost: 7500, tdp: 650, vram: '32GB', tier: 'NVIDIA CUDA Workstation', isTurnKey: true },
	{ id: 'prebuilt-boox-rtx-5090', name: 'BOXX / Puget Workstation (RTX 5090 32GB) - $5,850', cost: 5850, tdp: 700, vram: '32GB', tier: 'NVIDIA CUDA Workstation', isTurnKey: true },

	// TIER 4: Consumer & Used NVIDIA Hardware
	{ id: 'rtx3070', name: 'RTX 3070 (8GB VRAM) - $499', cost: 499, tdp: 220, vram: '8GB', tier: 'NVIDIA CUDA GPU', isTurnKey: false },
	{ id: 'rtx4070', name: 'RTX 4070 (12GB VRAM) - $599', cost: 599, tdp: 200, vram: '12GB', tier: 'NVIDIA CUDA GPU', isTurnKey: false },
	{ id: 'rtx4080', name: 'RTX 4080 (16GB VRAM) - $1,199', cost: 1199, tdp: 320, vram: '16GB', tier: 'NVIDIA CUDA GPU', isTurnKey: false },
	{ id: 'rtx4090', name: 'RTX 4090 (24GB VRAM) - $1,599', cost: 1599, tdp: 450, vram: '24GB', tier: 'NVIDIA CUDA GPU', isTurnKey: false },
	{ id: 'used-rtx-3090', name: 'Used Single RTX 3090 (24GB VRAM) - $699', cost: 699, tdp: 350, vram: '24GB', tier: 'NVIDIA CUDA GPU', isTurnKey: false },
	{ id: 'used-dual-rtx-3090', name: 'DIY Dual Used RTX 3090s (48GB VRAM) - $1,398', cost: 1398, tdp: 700, vram: '48GB', tier: 'NVIDIA CUDA GPU', isTurnKey: false },

	// TIER 5: Enterprise AI Workstations & Servers (H100, H200, B200, L40S, etc.)
	{ id: 'nvidia-l4', name: 'NVIDIA L4 PCIe Workstation GPU (24GB) - $1,250', cost: 1250, tdp: 75, vram: '24GB', tier: 'Enterprise AI Hardware', isTurnKey: false },
	{ id: 'rtx-6000-ada', name: 'NVIDIA RTX 6000 Ada Workstation (48GB) - $8,500', cost: 8500, tdp: 300, vram: '48GB', tier: 'Enterprise AI Hardware', isTurnKey: true },
	{ id: 'dual-rtx-6000-ada', name: 'Dual NVIDIA RTX 6000 Ada Workstation (96GB) - $17,500', cost: 17500, tdp: 600, vram: '96GB', tier: 'Enterprise AI Hardware', isTurnKey: true },
	{ id: 'nvidia-l40s-pcie', name: 'NVIDIA L40S PCIe Workstation (48GB) - $12,500', cost: 12500, tdp: 350, vram: '48GB', tier: 'Enterprise AI Hardware', isTurnKey: true },
	{ id: 'quad-nvidia-l40s', name: '4x NVIDIA L40S Workstation Node (192GB) - $48,000', cost: 48000, tdp: 1400, vram: '192GB', tier: 'Enterprise AI Hardware', isTurnKey: true },
	{ id: 'quad-rtx-4090-node', name: '4x RTX 4090 DIY Deep Learning Node (96GB) - $10,500', cost: 10500, tdp: 1800, vram: '96GB', tier: 'Enterprise AI Hardware', isTurnKey: true },
	{ id: 'nvidia-h100-pcie', name: 'NVIDIA H100 PCIe Workstation (80GB) - $35,000', cost: 35000, tdp: 350, vram: '80GB', tier: 'Enterprise AI Hardware', isTurnKey: true },
	{ id: 'nvidia-h200-sxm', name: 'NVIDIA H200 SXM Workstation (141GB) - $48,000', cost: 48000, tdp: 700, vram: '141GB', tier: 'Enterprise AI Hardware', isTurnKey: true },
	{ id: 'nvidia-b200-sxm', name: 'NVIDIA B200 SXM Workstation (180GB) - $55,000', cost: 55000, tdp: 1000, vram: '180GB', tier: 'Enterprise AI Hardware', isTurnKey: true },
	{ id: 'octa-nvidia-h100', name: '8x NVIDIA H100 SXM HGX Server (640GB) - $320,000', cost: 320000, tdp: 10200, vram: '640GB', tier: 'Enterprise AI Hardware', isTurnKey: true },
	{ id: 'octa-nvidia-h200', name: '8x NVIDIA H200 SXM HGX Server (1128GB) - $420,000', cost: 420000, tdp: 11000, vram: '1128GB', tier: 'Enterprise AI Hardware', isTurnKey: true },
	{ id: 'octa-nvidia-b200', name: '8x NVIDIA B200 HGX Server (1440GB) - $510,000', cost: 510000, tdp: 12000, vram: '1440GB', tier: 'Enterprise AI Hardware', isTurnKey: true }
];

const CLOUD_PROVIDERS_EXPLORER: CloudProviderDetail[] = [
	{
		id: 'runpod',
		name: 'RunPod',
		description: 'Targets developers needing fast, flexible deployments with Secure Cloud (enterprise data centers) and Community Cloud (peer-to-peer distributed networks). Supports containerized pods, serverless endpoints, and dedicated multi-GPU clusters.',
		billingUnit: 'Per-second billing (Secure Cloud)',
		egress: 'Free egress',
		storageCost: '$0.10 to $0.20 per GB / month',
		storageRate: 0.15,
		affiliateUrl: 'https://runpod.io?rc=giniloh',
		ctaText: 'Try RunPod (No Upfront Cost) →',
		type: 'Standard',
		gpus: [
			{ gpuModel: 'NVIDIA B300', vram: '288 GB', rate: 7.39 },
			{ gpuModel: 'NVIDIA B200', vram: '180 GB', rate: 5.89, note: 'Serverless: $8.64' },
			{ gpuModel: 'NVIDIA H200 SXM', vram: '141 GB', rate: 4.39 },
			{ gpuModel: 'NVIDIA H100 SXM', vram: '80 GB', rate: 3.29, communityRate: 2.69 },
			{ gpuModel: 'NVIDIA H100 PCIe', vram: '80 GB', rate: 2.89 },
			{ gpuModel: 'NVIDIA A100 SXM', vram: '80 GB', rate: 1.49 },
			{ gpuModel: 'NVIDIA A100 PCIe', vram: '80 GB', rate: 1.39 },
			{ gpuModel: 'NVIDIA L40S', vram: '48 GB', rate: 0.86, note: 'Spot option available' },
			{ gpuModel: 'NVIDIA RTX 4090', vram: '24 GB', rate: 0.69, note: 'Spot option available' },
			{ gpuModel: 'NVIDIA RTX 3090', vram: '24 GB', rate: 0.46, note: 'Spot option available' }
		]
	},
	{
		id: 'lambda',
		name: 'Lambda Labs',
		description: 'Focuses on simplicity, research teams, and enterprise model pre-training. Features the "Lambda Stack"—a pre-configured Ubuntu environment loaded with PyTorch, CUDA, and NCCL.',
		billingUnit: 'Per-hour billing',
		egress: 'Free and unlimited egress',
		storageCost: '$0.20 per GB / month',
		storageRate: 0.20,
		affiliateUrl: 'https://lambdalabs.com',
		ctaText: 'Deploy on Lambda Labs →',
		type: 'Enterprise',
		gpus: [
			{ gpuModel: 'NVIDIA B200 SXM6', vram: '180 GB', rate: 6.99, note: '8-GPU node: $6.69' },
			{ gpuModel: 'NVIDIA H100 SXM', vram: '80 GB', rate: 4.29, note: '8-GPU node: $3.99' },
			{ gpuModel: 'NVIDIA H100 PCIe', vram: '80 GB', rate: 3.29, note: 'Or $2.49' },
			{ gpuModel: 'NVIDIA GH200', vram: '96 GB', rate: 2.29, note: 'Or $1.49' },
			{ gpuModel: 'NVIDIA A100 SXM', vram: '80 GB', rate: 1.79 },
			{ gpuModel: 'NVIDIA RTX A6000', vram: '48 GB', rate: 1.09 },
			{ gpuModel: 'NVIDIA RTX 6000 Ada', vram: '48 GB', rate: 0.69 }
		]
	},
	{
		id: 'nebius',
		name: 'Nebius AI Cloud',
		description: 'Specializes in standalone applications and highly scalable Kubernetes clusters mapped across European compliance standards. High-end configurations utilize Intel Sapphire Rapids and NVLink interconnect networks.',
		billingUnit: 'Billed based on resource usage',
		egress: 'Standard compliance network',
		storageCost: '$0.071 per GiB / month',
		storageRate: 0.071,
		affiliateUrl: 'https://nebius.com',
		ctaText: 'Deploy on Nebius →',
		type: 'Enterprise',
		gpus: [
			{ gpuModel: 'NVIDIA H200 NVLink', vram: '141 GB', rate: 4.50, note: '8x node: $36.00' },
			{ gpuModel: 'NVIDIA H100 NVLink', vram: '80 GB', rate: 3.85, note: '8x node: $30.80' },
			{ gpuModel: 'NVIDIA B200', vram: '180 GB', rate: 5.50 },
			{ gpuModel: 'NVIDIA L40S PCIe', vram: '48 GB', rate: 1.35 }
		]
	},
	{
		id: 'spheron',
		name: 'Spheron Network',
		description: 'Operates as a decentralized bare-metal aggregator, securing enterprise SLA guarantees from data center partners while passing on significant cost reductions, particularly for spot instances.',
		billingUnit: 'Per-minute billing with no minimum commitments',
		egress: 'Zero egress fees',
		storageCost: '$0.10 per GB / month',
		storageRate: 0.10,
		affiliateUrl: 'https://spheron.network',
		ctaText: 'Deploy on Spheron →',
		type: 'Decentralized',
		gpus: [
			{ gpuModel: 'NVIDIA B300 SXM', vram: '288 GB', rate: 6.80, spotRate: 2.45 },
			{ gpuModel: 'NVIDIA B200 SXM6', vram: '180 GB', rate: 6.02, spotRate: 2.12 },
			{ gpuModel: 'NVIDIA H200 SXM', vram: '141 GB', rate: 4.54 },
			{ gpuModel: 'NVIDIA H100 SXM5', vram: '80 GB', rate: 2.50, spotRate: 1.03 },
			{ gpuModel: 'NVIDIA H100 PCIe', vram: '80 GB', rate: 2.01 },
			{ gpuModel: 'NVIDIA A100 SXM4', vram: '80 GB', rate: 1.07, spotRate: 0.60 },
			{ gpuModel: 'NVIDIA L40S PCIe', vram: '48 GB', rate: 0.81, note: 'Range: $0.72 - $0.91' },
			{ gpuModel: 'NVIDIA RTX 4090', vram: '24 GB', rate: 0.55 }
		]
	},
	{
		id: 'upcloud',
		name: 'UpCloud',
		description: 'Helsinki-headquartered European cloud provider offering single and multi-GPU nodes mapped with dedicated resource configurations. The entire platform operates on 100% renewable energy.',
		billingUnit: 'Usage-based hourly billing',
		egress: 'Zero egress fees within generous fair usage (1 to 48 TB)',
		storageCost: '$0.12 per GB / month',
		storageRate: 0.12,
		affiliateUrl: 'https://upcloud.com',
		ctaText: 'Deploy on UpCloud →',
		type: 'Standard',
		gpus: [
			{ gpuModel: 'NVIDIA B200', vram: '180 GB', rate: 5.20, note: 'Range: $5.16 - $5.23' },
			{ gpuModel: 'NVIDIA H100 SXM', vram: '80 GB', rate: 2.06, note: 'Range: $2.05 - $2.08' },
			{ gpuModel: 'NVIDIA L40S', vram: '48 GB', rate: 1.28, note: 'Range: $1.27 - $1.29' },
			{ gpuModel: 'NVIDIA L40S Mid', vram: '48 GB', rate: 1.43 },
			{ gpuModel: 'NVIDIA L40S High', vram: '48 GB', rate: 2.07 },
			{ gpuModel: 'NVIDIA L4', vram: '24 GB', rate: 0.66, note: 'Range: $0.66 - $0.67' }
		]
	},
	{
		id: 'acecloud',
		name: 'AceCloud',
		description: 'India-focused private cloud provider specializing in highly competitive local rates, bare-metal isolation, and bypassing complex hyperscaler management. Flat-rate billing with included 24/7 dedicated support.',
		billingUnit: 'Flat-rate hourly billing',
		egress: 'Free and unlimited network egress',
		storageCost: '$0.10 per GB / month',
		storageRate: 0.10,
		affiliateUrl: 'https://acecloudhosting.com',
		ctaText: 'Try AceCloud →',
		type: 'Standard',
		gpus: [
			{ gpuModel: 'NVIDIA H100 HGX', vram: '80 GB', rate: 3.78, note: '₹315.07/hr' },
			{ gpuModel: 'NVIDIA A100', vram: '80 GB', rate: 2.22, note: '₹184.93/hr' },
			{ gpuModel: 'NVIDIA RTX 6000 Ada', vram: '48 GB', rate: 1.01, note: '₹84.28/hr' },
			{ gpuModel: 'NVIDIA RTX A6000', vram: '48 GB', rate: 0.71, note: '₹59.08/hr' },
			{ gpuModel: 'NVIDIA A30', vram: '24 GB', rate: 0.86, note: '₹71.92/hr' },
			{ gpuModel: 'NVIDIA A2', vram: '16 GB', rate: 0.28, note: '₹23.01/hr' }
		]
	},
	{
		id: 'vastai',
		name: 'Vast.ai',
		description: 'Operates a massive global, peer-to-peer marketplace that aggregates computing units from crypto mines, independent data centers, and personal machines. Extremely cost-efficient, but does not offer standard enterprise SLAs.',
		billingUnit: 'Hourly billing dynamically adjusted on supply & demand',
		egress: 'Varies by machine and host network speed',
		storageCost: '$0.05 per GB / month (approx)',
		storageRate: 0.05,
		affiliateUrl: 'https://vast.ai?ref=giniloh',
		ctaText: 'Try Vast.ai (Best Pricing) →',
		type: 'Decentralized',
		gpus: [
			{ gpuModel: 'NVIDIA H100 SXM5', vram: '80 GB', rate: 3.20, spotRate: 1.90, note: 'Range: $2.50 - $3.89' },
			{ gpuModel: 'NVIDIA A100 80GB', vram: '80 GB', rate: 1.40, spotRate: 0.71, note: 'Range: $0.90 - $1.89' },
			{ gpuModel: 'NVIDIA L40S', vram: '48 GB', rate: 0.47, spotRate: 0.27, note: 'Range: $0.40 - $0.55' },
			{ gpuModel: 'NVIDIA RTX 4090', vram: '24 GB', rate: 0.32, spotRate: 0.13, note: 'Range: $0.20 - $0.44' },
			{ gpuModel: 'NVIDIA RTX A4000', vram: '16 GB', rate: 0.09, spotRate: 0.06, note: 'Range: $0.07 - $0.11' }
		]
	},
	{
		id: 'hyperstack',
		name: 'Hyperstack',
		description: 'European-focused, enterprise-grade GPU cloud featuring instant provisioning, per-minute billing, and clean bare-metal environments with zero configuration overhead.',
		billingUnit: 'Per-minute billing',
		egress: 'Generally zero egress fees',
		storageCost: '$0.10 per GB / month',
		storageRate: 0.10,
		affiliateUrl: 'https://hyperstack.com',
		ctaText: 'Deploy on Hyperstack →',
		type: 'Enterprise',
		gpus: [
			{ gpuModel: 'NVIDIA H200', vram: '141 GB', rate: 3.50 },
			{ gpuModel: 'NVIDIA H100 SXM5', vram: '80 GB', rate: 1.90, spotRate: 1.52 },
			{ gpuModel: 'NVIDIA H100 NVL', vram: '94 GB', rate: 1.95 },
			{ gpuModel: 'NVIDIA A100 SXM', vram: '80 GB', rate: 1.35 },
			{ gpuModel: 'NVIDIA RTX PRO 6000', vram: '96 GB', rate: 1.80 },
			{ gpuModel: 'NVIDIA L40', vram: '40 GB', rate: 1.00 },
			{ gpuModel: 'NVIDIA RTX A6000', vram: '48 GB', rate: 0.50 },
			{ gpuModel: 'NVIDIA RTX A4000', vram: '16 GB', rate: 0.15 }
		]
	},
	{
		id: 'thunder',
		name: 'Thunder Compute',
		description: 'Focuses on direct VS Code SSH execution, live hardware swaps, and persistent workspaces, catering to ML engineers looking for simple, low-cost developer boxes with one-click single GPU access.',
		billingUnit: 'Per-minute billing with persistent storage volumes',
		egress: 'Included network egress',
		storageCost: '$0.15 per GB / month',
		storageRate: 0.15,
		affiliateUrl: 'https://thundercompute.com',
		ctaText: 'Start on Thunder Compute →',
		type: 'Standard',
		gpus: [
			{ gpuModel: 'NVIDIA H100 SXM', vram: '80 GB', rate: 1.38, note: 'Neocloud floor' },
			{ gpuModel: 'NVIDIA A100', vram: '80 GB', rate: 0.78, note: 'Or $0.66/hr floor' },
			{ gpuModel: 'NVIDIA RTX A6000', vram: '48 GB', rate: 0.35 }
		]
	},
	{
		id: 'coreweave',
		name: 'CoreWeave',
		description: 'Highly specialized AI hyperscaler, backing massive multi-node training workflows and VFX pipelines. Billed per-second. Capacity is primarily sold in 8-GPU node increments or contracted clusters.',
		billingUnit: 'Per-second billing',
		egress: 'Zero egress or request fees',
		storageCost: '$0.07 to $0.11 per GB / month',
		storageRate: 0.09,
		affiliateUrl: 'https://coreweave.com',
		ctaText: 'Scale on CoreWeave →',
		type: 'Enterprise',
		gpus: [
			{ gpuModel: 'NVIDIA GB200', vram: '384 GB', rate: 10.50, note: '4x HGX Node' },
			{ gpuModel: 'NVIDIA B200', vram: '192 GB', rate: 8.60, note: '8x HGX Node ($68.80/hr)' },
			{ gpuModel: 'NVIDIA GH200', vram: '96 GB', rate: 6.50, note: 'Standalone VM' },
			{ gpuModel: 'NVIDIA H200 SXM', vram: '141 GB', rate: 6.31, note: '8x HGX Node ($50.44/hr)' },
			{ gpuModel: 'NVIDIA H100 SXM5', vram: '80 GB', rate: 6.16, note: 'Committed: $2.44' },
			{ gpuModel: 'NVIDIA A100 SXM', vram: '80 GB', rate: 2.70, note: 'Committed: $1.19' },
			{ gpuModel: 'NVIDIA L40S', vram: '48 GB', rate: 2.25, note: '8x Node ($18.00/hr)' },
			{ gpuModel: 'NVIDIA L40', vram: '40 GB', rate: 1.25, note: '8x Node ($10.00/hr)' }
		]
	},
	{
		id: 'gmicloud',
		name: 'GMI Cloud',
		description: 'Operates isolated, private GPU environments that eliminate hypervisor overhead, leading to lower per-token costs. Flat-rate pricing with dedicated clusters.',
		billingUnit: 'Flat-rate pricing model',
		egress: 'Dedicated network connection',
		storageCost: '$0.10 per GB / month',
		storageRate: 0.10,
		affiliateUrl: 'https://gmicloud.ai',
		ctaText: 'Deploy on GMI Cloud →',
		type: 'Enterprise',
		gpus: [
			{ gpuModel: 'NVIDIA H200 SXM', vram: '141 GB', rate: 2.55, note: 'Range: $2.50 - $2.60' },
			{ gpuModel: 'NVIDIA H100 SXM', vram: '80 GB', rate: 2.00, note: 'HGX dedicated clusters' },
			{ gpuModel: 'NVIDIA B200', vram: '180 GB', rate: 4.00 },
			{ gpuModel: 'NVIDIA GB200', vram: '384 GB', rate: 8.00 }
		]
	},
	{
		id: 'jarvislabs',
		name: 'JarvisLabs',
		description: 'Targets developers needing sub-90-second startups, persistent notebooks, and transparent billing. User-friendly and very responsive.',
		billingUnit: 'Hourly billing with transparent dashboard',
		egress: 'Zero egress fees',
		storageCost: '$0.10 per GB / month',
		storageRate: 0.10,
		affiliateUrl: 'https://jarvislabs.ai',
		ctaText: 'Start on JarvisLabs →',
		type: 'Standard',
		gpus: [
			{ gpuModel: 'NVIDIA H200', vram: '141 GB', rate: 3.80 },
			{ gpuModel: 'NVIDIA H100 SXM', vram: '80 GB', rate: 2.69 },
			{ gpuModel: 'NVIDIA A100 (80GB)', vram: '80 GB', rate: 1.49 },
			{ gpuModel: 'NVIDIA RTX 6000 Ada', vram: '48 GB', rate: 0.99 },
			{ gpuModel: 'NVIDIA RTX 3090', vram: '24 GB', rate: 0.29 }
		]
	}
];

const PRESET_FLAT_LIST = CLOUD_PROVIDERS_EXPLORER.flatMap(provider =>
	provider.gpus.map(gpu => ({
		id: `${provider.id}-${gpu.gpuModel.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
		providerId: provider.id,
		providerName: provider.name,
		gpuModel: gpu.gpuModel,
		vram: gpu.vram,
		rate: gpu.rate,
		storageRate: provider.storageRate,
		affiliateUrl: provider.affiliateUrl,
		ctaText: provider.ctaText
	}))
);

export default function LocalVsCloudGpuCalculator() {
	// 1. Usage Pattern States (Sliders)
	const [hoursPerDay, setHoursPerDay] = useState<number>(6);
	const [daysPerMonth, setDaysPerMonth] = useState<number>(18);
	const [timePeriodMonths, setTimePeriodMonths] = useState<number>(12);
	const [electricityRate, setElectricityRate] = useState<number>(0.12);
	const [storageSizeGb, setStorageSizeGb] = useState<number>(100);
	const [systemCost, setSystemCost] = useState<number>(1000);

	// 2. Selection States
	const [selectedGpuId, setSelectedGpuId] = useState<string>('rtx4090');
	const [selectedProviderId, setSelectedProviderId] = useState<string>('runpod-nvidia-rtx-4090');

	// Auto-adjust system cost based on turnkey hardware selection
	useEffect(() => {
		const selectedOption = GPU_MODELS.find(g => g.id === selectedGpuId);
		if (selectedOption) {
			if (selectedOption.isTurnKey) {
				setSystemCost(0);
			} else if (systemCost === 0) {
				setSystemCost(1000); // Default DIY system components cost
			}
		}
	}, [selectedGpuId]);

	// Find active items
	const activeGpu = useMemo(() => GPU_MODELS.find(g => g.id === selectedGpuId) || GPU_MODELS[0], [selectedGpuId]);
	const activeProvider = useMemo(() => PRESET_FLAT_LIST.find(p => p.id === selectedProviderId) || PRESET_FLAT_LIST[0], [selectedProviderId]);

	// 3. Mathematical Calculations
	const calculations = useMemo(() => {
		const monthlyHours = hoursPerDay * daysPerMonth;
		const totalHours = monthlyHours * timePeriodMonths;

		// Local Cost Calculations
		const hardwareCost = activeGpu.cost + systemCost;
		const totalPowerDrawKw = (activeGpu.tdp + 250) / 1000; // Adding 250W base system draw (CPU, RAM, fans, motherboard)
		const electricityCost = totalHours * totalPowerDrawKw * electricityRate;
		const maintenanceCost = hardwareCost * 0.05 * (timePeriodMonths / 12); // 5% maintenance budget per year
		
		const localTco = hardwareCost + electricityCost + maintenanceCost;
		const localCostPerHour = totalHours > 0 ? localTco / totalHours : 0;

		// Cloud Cost Calculations
		const cloudUsageCost = totalHours * activeProvider.rate;
		const cloudStorageCost = storageSizeGb * activeProvider.storageRate * timePeriodMonths;
		
		const cloudTco = cloudUsageCost + cloudStorageCost;
		const cloudCostPerHour = totalHours > 0 ? cloudTco / totalHours : 0;

		// Savings & TCO Comparison
		const localWins = localTco < cloudTco;
		const netSavings = Math.abs(cloudTco - localTco);
		const monthlyDifference = netSavings / timePeriodMonths;

		// Break-Even Calculations
		const upfrontPremium = (hardwareCost + maintenanceCost);
		const monthlySavings = (monthlyHours * activeProvider.rate + storageSizeGb * activeProvider.storageRate) - (monthlyHours * totalPowerDrawKw * electricityRate);
		
		let breakEvenMonths = Infinity;
		if (monthlySavings > 0) {
			breakEvenMonths = upfrontPremium / monthlySavings;
		}

		return {
			monthlyHours,
			totalHours,
			hardwareCost,
			electricityCost,
			maintenanceCost,
			localTco,
			localCostPerHour,
			cloudUsageCost,
			cloudStorageCost,
			cloudTco,
			cloudCostPerHour,
			localWins,
			netSavings,
			monthlyDifference,
			breakEvenMonths: breakEvenMonths === Infinity ? Infinity : parseFloat(breakEvenMonths.toFixed(1))
		};
	}, [hoursPerDay, daysPerMonth, timePeriodMonths, electricityRate, storageSizeGb, systemCost, activeGpu, activeProvider]);

	return (
		<>
			<div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
			{/* Left Column: User Controls & Sliders */}
			<div className="space-y-6">
				{/* Usage Pattern Card */}
				<div className="panel-soft rounded-[2rem] p-6 lg:p-8 space-y-6">
					<div className="flex items-center gap-2">
						<span className="text-xl">⚙️</span>
						<h3 className="text-xl font-bold text-white">Your Usage Pattern</h3>
					</div>

					{/* Hours per Day Slider */}
					<div className="space-y-2">
						<div className="flex justify-between items-center text-sm font-semibold text-slate-300">
							<span>Hours per Day</span>
							<div className="flex items-center gap-1 bg-slate-950/60 [.light_&]:bg-white rounded-lg px-2 py-0.5 border border-slate-800/80 [.light_&]:border-slate-200 focus-within:border-cyan-500/50">
								<input
									type="number"
									min="1"
									max="24"
									value={hoursPerDay}
									onChange={(e) => setHoursPerDay(Math.min(24, Math.max(1, Number(e.target.value))))}
									className="w-8 bg-transparent text-right font-mono text-sm font-semibold text-cyan-400 focus:outline-none border-none p-0"
								/>
								<span className="text-[10px] text-slate-500 font-mono">hrs</span>
							</div>
						</div>
						<input
							type="range"
							min="1"
							max="24"
							step="1"
							value={hoursPerDay}
							onChange={(e) => setHoursPerDay(Number(e.target.value))}
							className="w-full h-2 bg-slate-950 [.light_&]:bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-slate-800 [.light_&]:border-slate-300"
						/>
						<div className="flex justify-between text-[10px] text-slate-500 font-mono">
							<span>1 hour</span>
							<span>24 hours</span>
						</div>
					</div>

					{/* Days per Month Slider */}
					<div className="space-y-2">
						<div className="flex justify-between items-center text-sm font-semibold text-slate-300">
							<span>Days per Month</span>
							<div className="flex items-center gap-1 bg-slate-950/60 [.light_&]:bg-white rounded-lg px-2 py-0.5 border border-slate-800/80 [.light_&]:border-slate-200 focus-within:border-cyan-500/50">
								<input
									type="number"
									min="1"
									max="30"
									value={daysPerMonth}
									onChange={(e) => setDaysPerMonth(Math.min(30, Math.max(1, Number(e.target.value))))}
									className="w-8 bg-transparent text-right font-mono text-sm font-semibold text-cyan-400 focus:outline-none border-none p-0"
								/>
								<span className="text-[10px] text-slate-500 font-mono">days</span>
							</div>
						</div>
						<input
							type="range"
							min="1"
							max="30"
							step="1"
							value={daysPerMonth}
							onChange={(e) => setDaysPerMonth(Number(e.target.value))}
							className="w-full h-2 bg-slate-950 [.light_&]:bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-slate-800 [.light_&]:border-slate-300"
						/>
						<div className="flex justify-between text-[10px] text-slate-500 font-mono">
							<span>1 day</span>
							<span>30 days</span>
						</div>
					</div>

					{/* Time Period Months Slider */}
					<div className="space-y-2">
						<div className="flex justify-between items-center text-sm font-semibold text-slate-300">
							<span>Time Period (Months)</span>
							<div className="flex items-center gap-1 bg-slate-950/60 [.light_&]:bg-white rounded-lg px-2 py-0.5 border border-slate-800/80 [.light_&]:border-slate-200 focus-within:border-cyan-500/50">
								<input
									type="number"
									min="1"
									max="36"
									value={timePeriodMonths}
									onChange={(e) => setTimePeriodMonths(Math.min(36, Math.max(1, Number(e.target.value))))}
									className="w-8 bg-transparent text-right font-mono text-sm font-semibold text-cyan-400 focus:outline-none border-none p-0"
								/>
								<span className="text-[10px] text-slate-500 font-mono">mo</span>
							</div>
						</div>
						<input
							type="range"
							min="1"
							max="36"
							step="1"
							value={timePeriodMonths}
							onChange={(e) => setTimePeriodMonths(Number(e.target.value))}
							className="w-full h-2 bg-slate-950 [.light_&]:bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-slate-800 [.light_&]:border-slate-300"
						/>
						<div className="flex justify-between text-[10px] text-slate-500 font-mono">
							<span>1 month</span>
							<span>36 months</span>
						</div>
					</div>

					{/* Computed Monthly Hours Summary */}
					<div className="rounded-[1.4rem] border border-cyan-500/15 [.light_&]:border-cyan-200 bg-cyan-950/20 [.light_&]:bg-cyan-50/70 p-4">
						<p className="font-mono text-xs uppercase tracking-wider text-slate-400">Monthly Usage</p>
						<p className="text-3xl font-black text-cyan-400 mt-1 font-mono">{calculations.monthlyHours} hours</p>
					</div>
				</div>

				{/* Select GPU Card */}
				<div className="panel-soft rounded-[2rem] p-6 lg:p-8 space-y-6">
					<div className="flex items-center gap-2">
						<span className="text-xl">🎮</span>
						<h3 className="text-xl font-bold text-white">Select GPU</h3>
					</div>

					<div>
						<label htmlFor="gpu-select" className="sr-only">GPU Model Option</label>
						<select
							id="gpu-select"
							value={selectedGpuId}
							onChange={(e) => setSelectedGpuId(e.target.value)}
							className="w-full rounded-xl border border-slate-700/80 [.light_&]:border-slate-200 bg-slate-950 [.light_&]:bg-white px-4 py-3.5 text-base font-semibold text-white [.light_&]:text-slate-800 outline-none focus:border-cyan-400"
						>
							<optgroup label="Tier 1: Apple Silicon (Unified Memory)">
								{GPU_MODELS.filter(g => g.tier === 'Apple Silicon').map(g => (
									<option key={g.id} value={g.id}>{g.name}</option>
								))}
							</optgroup>
							<optgroup label="Tier 2: AMD Mini PCs (Budget Always-On)">
								{GPU_MODELS.filter(g => g.tier === 'AMD Mini PC').map(g => (
									<option key={g.id} value={g.id}>{g.name}</option>
								))}
							</optgroup>
							<optgroup label="Tier 3: Professional CUDA Workstations">
								{GPU_MODELS.filter(g => g.tier === 'NVIDIA CUDA Workstation').map(g => (
									<option key={g.id} value={g.id}>{g.name}</option>
								))}
							</optgroup>
							<optgroup label="Tier 4: Consumer & Used NVIDIA GPUs">
								{GPU_MODELS.filter(g => g.tier === 'NVIDIA CUDA GPU').map(g => (
									<option key={g.id} value={g.id}>{g.name}</option>
								))}
							</optgroup>
							<optgroup label="Tier 5: Enterprise AI Workstations & Servers">
								{GPU_MODELS.filter(g => g.tier === 'Enterprise AI Hardware').map(g => (
									<option key={g.id} value={g.id}>{g.name}</option>
								))}
							</optgroup>
						</select>
					</div>

					{/* GPU Metric displays */}
					<div className="grid grid-cols-2 gap-4">
						<div className="rounded-xl border border-slate-800/80 [.light_&]:border-slate-200 bg-slate-950/40 [.light_&]:bg-slate-50/50 p-4">
							<p className="text-xs text-slate-500">Hardware Cost</p>
							<p className="text-lg font-bold text-emerald-400 mt-0.5 font-mono">{formatCurrency(activeGpu.cost)}</p>
						</div>
						<div className="rounded-xl border border-slate-800/80 [.light_&]:border-slate-200 bg-slate-950/40 [.light_&]:bg-slate-50/50 p-4">
							<p className="text-xs text-slate-500">Power Draw (TDP)</p>
							<p className="text-lg font-bold text-amber-400 mt-0.5 font-mono">{activeGpu.tdp}W</p>
						</div>
					</div>

					{/* System components price slider */}
					<div className="space-y-2 border-t border-slate-800/60 [.light_&]:border-slate-200/80 pt-4">
						<div className="flex justify-between items-center text-sm font-semibold text-slate-300">
							<span>System components (CPU, RAM, Motherboard, etc.)</span>
							<div className="flex items-center gap-0.5 bg-slate-950/60 [.light_&]:bg-white rounded-lg px-2 py-0.5 border border-slate-800/80 [.light_&]:border-slate-200 focus-within:border-cyan-500/50">
								<span className="text-xs text-slate-500 font-mono">$</span>
								<input
									type="number"
									min="0"
									max="5000"
									step="50"
									value={systemCost}
									onChange={(e) => setSystemCost(Math.min(5000, Math.max(0, Number(e.target.value))))}
									className="w-14 bg-transparent text-right font-mono text-sm font-semibold text-emerald-400 focus:outline-none border-none p-0"
								/>
							</div>
						</div>
						<input
							type="range"
							min="0"
							max="5000"
							step="50"
							value={systemCost}
							onChange={(e) => setSystemCost(Number(e.target.value))}
							className="w-full h-2 bg-slate-950 [.light_&]:bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-slate-800 [.light_&]:border-slate-300"
						/>
						<div className="flex justify-between text-[10px] text-slate-500 font-mono">
							<span>$0</span>
							<span>$5,000</span>
						</div>
					</div>

					{/* Electricity Rate Slider */}
					<div className="space-y-2 border-t border-slate-800/60 [.light_&]:border-slate-200/80 pt-4">
						<div className="flex justify-between items-center text-sm font-semibold text-slate-300">
							<span>Local Electricity Rate</span>
							<div className="flex items-center gap-0.5 bg-slate-950/60 [.light_&]:bg-white rounded-lg px-2 py-0.5 border border-slate-800/80 [.light_&]:border-slate-200 focus-within:border-cyan-500/50">
								<span className="text-xs text-slate-500 font-mono">$</span>
								<input
									type="number"
									min="0.05"
									max="0.60"
									step="0.01"
									value={electricityRate}
									onChange={(e) => setElectricityRate(Math.min(0.60, Math.max(0.05, Number(e.target.value))))}
									className="w-12 bg-transparent text-right font-mono text-sm font-semibold text-cyan-400 focus:outline-none border-none p-0"
								/>
								<span className="text-xs text-slate-500 font-mono">/kWh</span>
							</div>
						</div>
						<input
							type="range"
							min="0.05"
							max="0.60"
							step="0.01"
							value={electricityRate}
							onChange={(e) => setElectricityRate(Number(e.target.value))}
							className="w-full h-2 bg-slate-950 [.light_&]:bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-slate-800 [.light_&]:border-slate-300"
						/>
						<div className="flex justify-between text-[10px] text-slate-500 font-mono">
							<span>$0.05/kWh</span>
							<span>$0.60/kWh</span>
						</div>
					</div>
				</div>

				{/* Select Cloud Provider Card */}
				<div className="panel-soft rounded-[2rem] p-6 lg:p-8 space-y-6">
					<div className="flex items-center gap-2">
						<span className="text-xl">☁️</span>
						<h3 className="text-xl font-bold text-white">Select Cloud Provider & GPU</h3>
					</div>

					<div>
						<label htmlFor="cloud-provider-select" className="sr-only">Compare Cloud Provider & GPU</label>
						<select
							id="cloud-provider-select"
							value={selectedProviderId}
							onChange={(e) => setSelectedProviderId(e.target.value)}
							className="w-full rounded-xl border border-slate-700/80 [.light_&]:border-slate-200 bg-slate-950 [.light_&]:bg-white px-4 py-3.5 text-sm font-semibold text-white [.light_&]:text-slate-800 outline-none focus:border-cyan-400"
						>
							{CLOUD_PROVIDERS_EXPLORER.map(provider => (
								<optgroup key={provider.id} label={provider.name}>
									{provider.gpus.map((gpu) => {
										const presetId = `${provider.id}-${gpu.gpuModel.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
										return (
											<option key={presetId} value={presetId}>
												{gpu.gpuModel} ({gpu.vram}) — ${gpu.rate.toFixed(2)}/hr
											</option>
										);
									})}
								</optgroup>
							))}
						</select>
					</div>

					<div className="rounded-xl border border-slate-800/80 [.light_&]:border-slate-200 bg-slate-950/40 [.light_&]:bg-slate-50/50 p-4 space-y-2">
						<div className="flex justify-between text-xs">
							<span className="text-slate-500">Provider:</span>
							<span className="font-semibold text-white">{activeProvider.providerName}</span>
						</div>
						<div className="flex justify-between text-xs">
							<span className="text-slate-500">Billing Model:</span>
							<span className="font-semibold text-slate-300">
								{CLOUD_PROVIDERS_EXPLORER.find(p => p.id === activeProvider.providerId)?.billingUnit}
							</span>
						</div>
						<div className="flex justify-between text-xs">
							<span className="text-slate-500">Network Egress:</span>
							<span className="font-semibold text-emerald-400">
								{CLOUD_PROVIDERS_EXPLORER.find(p => p.id === activeProvider.providerId)?.egress}
							</span>
						</div>
						<div className="flex justify-between text-xs">
							<span className="text-slate-500">Storage rate:</span>
							<span className="font-semibold text-cyan-400 font-mono">
								${activeProvider.storageRate.toFixed(2)}/GB/mo
							</span>
						</div>
					</div>

					{/* Persistent Cloud Storage Slider */}
					<div className="space-y-2 border-t border-slate-800/60 [.light_&]:border-slate-200/80 pt-4">
						<div className="flex justify-between items-center text-sm font-semibold text-slate-300">
							<span>Cloud Storage Size</span>
							<div className="flex items-center gap-1 bg-slate-950/60 [.light_&]:bg-white rounded-lg px-2 py-0.5 border border-slate-800/80 [.light_&]:border-slate-200 focus-within:border-cyan-500/50">
								<input
									type="number"
									min="10"
									max="1200"
									step="10"
									value={storageSizeGb}
									onChange={(e) => setStorageSizeGb(Math.min(1200, Math.max(10, Number(e.target.value))))}
									className="w-12 bg-transparent text-right font-mono text-sm font-semibold text-cyan-400 focus:outline-none border-none p-0"
								/>
								<span className="text-[10px] text-slate-500 font-mono">GB</span>
							</div>
						</div>
						<input
							type="range"
							min="10"
							max="1200"
							step="10"
							value={storageSizeGb}
							onChange={(e) => setStorageSizeGb(Number(e.target.value))}
							className="w-full h-2 bg-slate-950 [.light_&]:bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-slate-800 [.light_&]:border-slate-300"
						/>
						<div className="flex justify-between text-[10px] text-slate-500 font-mono">
							<span>10 GB</span>
							<span>1,200 GB</span>
						</div>
						<p className="text-[10px] text-slate-500">Persistent storage priced at $0.15 / GB / month</p>
					</div>
				</div>
			</div>

			{/* Right Column: Output / Verdict Panels */}
			<div className="space-y-6">
				{/* Cost Analysis Card */}
				<div className="panel-soft rounded-[2rem] p-6 sm:p-8 space-y-6">
					<div className="flex items-center gap-2">
						<span className="text-xl">💰</span>
						<h3 className="text-xl font-bold text-white">Cost Analysis</h3>
					</div>

					{/* Local Hardware Breakdown */}
					<div className="space-y-3 pb-5 border-b border-slate-800/80 [.light_&]:border-slate-200">
						<p className="text-sm font-bold text-slate-200 uppercase tracking-wide">Local Hardware</p>
						<div className="flex justify-between text-sm text-slate-400">
							<span>GPU Cost ({activeGpu.vram}):</span>
							<span className="font-mono text-white">{formatCurrency(activeGpu.cost)}</span>
						</div>
						<div className="flex justify-between text-sm text-slate-400">
							<span>System components:</span>
							<span className="font-mono text-white">{formatCurrency(systemCost)}</span>
						</div>
						<div className="flex justify-between text-sm text-slate-400">
							<span>Electricity ({timePeriodMonths} months):</span>
							<span className="font-mono text-white">{formatCurrency(calculations.electricityCost)}</span>
						</div>
						<div className="flex justify-between text-sm text-slate-400">
							<span>Maintenance budget:</span>
							<span className="font-mono text-white">{formatCurrency(calculations.maintenanceCost)}</span>
						</div>
						<div className="flex justify-between items-center text-base font-bold text-white pt-2 border-t border-slate-800/40 [.light_&]:border-slate-100">
							<span>Total Cost:</span>
							<span className="text-2xl text-amber-400 font-mono">{formatCurrency(calculations.localTco)}</span>
						</div>
						<div className="flex justify-between text-xs text-slate-400 font-mono">
							<span>Cost per Hour:</span>
							<span className="text-cyan-400">${calculations.localCostPerHour.toFixed(3)}/hr</span>
						</div>
					</div>

					{/* Cloud GPU Breakdown */}
					<div className="space-y-3 pt-1">
						<p className="text-sm font-bold text-slate-200 uppercase tracking-wide">{activeProvider.providerName} ({activeProvider.gpuModel}) Cloud</p>
						<div className="flex justify-between text-sm text-slate-400">
							<span>Usage ({timePeriodMonths} months):</span>
							<span className="font-mono text-white">{formatCurrency(calculations.cloudUsageCost)}</span>
						</div>
						<div className="flex justify-between text-sm text-slate-400">
							<span>Storage ({timePeriodMonths} months):</span>
							<span className="font-mono text-white">{formatCurrency(calculations.cloudStorageCost)}</span>
						</div>
						<div className="flex justify-between items-center text-base font-bold text-white pt-2 border-t border-slate-800/40 [.light_&]:border-slate-100">
							<span>Total Cost:</span>
							<span className="text-2xl text-cyan-400 font-mono">{formatCurrency(calculations.cloudTco)}</span>
						</div>
						<div className="flex justify-between text-xs text-slate-400 font-mono">
							<span>Cost per Hour:</span>
							<span className="text-cyan-400">${calculations.cloudCostPerHour.toFixed(3)}/hr</span>
						</div>
					</div>
				</div>

				{/* Verdict Card */}
				<div 
					className={`panel-soft rounded-[2rem] transition duration-300 border-2 ${
						calculations.localWins 
							? 'border-emerald-500 bg-gradient-to-br from-emerald-950/60 via-slate-950/80 to-emerald-900/40 shadow-[0_0_40px_rgba(16,185,129,0.25)] [.light_&]:border-emerald-500 [.light_&]:bg-[linear-gradient(135deg,rgba(167,243,208,0.65),rgba(209,250,229,0.95))] [.light_&]:shadow-[0_15px_35px_rgba(16,185,129,0.15)]' 
							: 'border-cyan-500 bg-gradient-to-br from-cyan-950/60 via-slate-950/80 to-cyan-900/40 shadow-[0_0_40px_rgba(34,211,238,0.25)] [.light_&]:border-cyan-500 [.light_&]:bg-[linear-gradient(135deg,rgba(165,243,252,0.65),rgba(207,250,254,0.95))] [.light_&]:shadow-[0_15px_35px_rgba(34,211,238,0.15)]'
					}`}
				>
					<div className="p-6 sm:p-8">
						<span className={`inline-flex rounded-full px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.24em] font-bold ${
							calculations.localWins 
								? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
								: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
						}`}>
							{calculations.localWins ? '🏠 Local Wins!' : '☁️ Cloud Wins!'}
						</span>

						<h3 className="mt-4 text-3xl font-extrabold text-white leading-tight">
							{calculations.localWins 
								? `Local saves ${formatCurrency(calculations.netSavings)}` 
								: `Cloud saves ${formatCurrency(calculations.netSavings)}`
							}
						</h3>

						<p className="mt-3 text-sm leading-6 text-slate-300">
							{calculations.localWins 
								? `Local hardware pays off after ${Number.isFinite(calculations.breakEvenMonths) ? `${calculations.breakEvenMonths} months` : 'Never'}.`
								: 'Renting on demand prevents costly hardware depreciation and upfront CapEx.'
							}
						</p>
					</div>
				</div>

				{/* Recommendation Card */}
				<div className="panel-soft rounded-[2rem] border border-pink-500/35 [.light_&]:border-pink-200/60 bg-gradient-to-br from-slate-900/90 to-pink-950/15 [.light_&]:bg-[linear-gradient(135deg,rgba(253,242,248,0.85),rgba(252,231,243,0.4))] p-6 shadow-[0_0_40px_rgba(236,72,153,0.15)] [.light_&]:shadow-[0_15px_30px_rgba(236,72,153,0.05)] flex flex-col gap-4">
					<div>
						<p className="font-mono text-xs uppercase tracking-[0.24em] text-pink-400 font-bold">
							🎯 Recommendation
						</p>
						<p className="mt-2 text-sm leading-6 text-slate-200">
							{calculations.localWins ? (
								<>
									For heavy usage of <strong>{calculations.monthlyHours} hours/month</strong>, local hardware becomes cost-effective after <strong>{calculations.breakEvenMonths} months</strong>.
								</>
							) : (
								<>
									For light usage of <strong>{calculations.monthlyHours} hours/month</strong>, cloud GPUs remain superior to offset the high hardware setup price.
								</>
							)}
						</p>
					</div>
					<a
						href={activeProvider.affiliateUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="w-full text-center py-3.5 px-6 font-bold text-white rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-lg transition duration-150 cursor-pointer"
					>
						{activeProvider.ctaText || `Try ${activeProvider.providerName} (No Upfront Cost) →`}
					</a>
				</div>

				{/* Metrics Widgets */}
				<div className="grid grid-cols-2 gap-4">
					<div className="panel-soft rounded-[1.5rem] p-5">
						<p className="text-xs text-slate-500 font-medium">Break-Even Point</p>
						<p className="text-2xl font-black text-white mt-1.5 font-mono">
							{Number.isFinite(calculations.breakEvenMonths)
								? `${calculations.breakEvenMonths} mo`
								: 'Never'}
						</p>
					</div>
					<div className="panel-soft rounded-[1.5rem] p-5">
						<p className="text-xs text-slate-500 font-medium">Monthly Difference</p>
						<p className="text-2xl font-black text-white mt-1.5 font-mono">
							{formatCurrency(calculations.monthlyDifference)}
						</p>
					</div>
				</div>

				{/* Ready to Start tutorials */}
				<div className="panel-soft rounded-[2rem] p-6 space-y-4">
					<p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500 font-bold">
						Quick Links
					</p>
					<p className="text-xs text-slate-400">Deploy directly on recommended providers in minutes.</p>
					<div className="flex flex-wrap gap-3">
						<a
							href="https://runpod.io?rc=giniloh"
							target="_blank"
							rel="noopener noreferrer"
							className="py-2.5 px-4 font-semibold text-xs text-slate-300 [.light_&]:text-slate-700 hover:text-white [.light_&]:hover:text-slate-900 rounded-lg border border-slate-800 [.light_&]:border-slate-200 bg-slate-950/60 [.light_&]:bg-white hover:bg-slate-900 [.light_&]:hover:bg-slate-50 transition"
						>
							RunPod Cloud
						</a>
						<a
							href="https://vast.ai?ref=giniloh"
							target="_blank"
							rel="noopener noreferrer"
							className="py-2.5 px-4 font-semibold text-xs text-slate-300 [.light_&]:text-slate-700 hover:text-white [.light_&]:hover:text-slate-900 rounded-lg border border-slate-800 [.light_&]:border-slate-200 bg-slate-950/60 [.light_&]:bg-white hover:bg-slate-900 [.light_&]:hover:bg-slate-50 transition"
						>
							Vast.ai Marketplace
						</a>
					</div>
				</div>
			</div>
		</div>

		{/* Interactive Cloud GPU Directory Section */}
		<div className="mt-12 border-t border-slate-800/80 [.light_&]:border-slate-200 pt-12 space-y-8">
			<div>
				<h3 className="text-2xl font-bold text-white sm:text-3xl">Cloud GPU Directory & Price Explorer</h3>
				<p className="text-slate-400 text-sm mt-2">
					Filter and search through detailed specifications, egress policies, storage costs, and hourly rates of 12 major cloud GPU services. Click "Compare" on any GPU configuration to load it into the TCO calculator above.
				</p>
			</div>

			<CloudGpuDirectory
				selectedPresetId={selectedProviderId}
				onSelectPreset={(presetId) => {
					setSelectedProviderId(presetId);
					window.scrollTo({ top: 0, behavior: 'smooth' });
				}}
			/>
		</div>
		</>
	);
}

function CloudGpuDirectory({
	onSelectPreset,
	selectedPresetId
}: {
	onSelectPreset: (presetId: string) => void;
	selectedPresetId: string;
}) {
	const [searchTerm, setSearchTerm] = useState('');
	const [activeTab, setActiveTab] = useState<'All' | 'Enterprise' | 'Standard' | 'Decentralized'>('All');

	const filteredProviders = useMemo(() => {
		return CLOUD_PROVIDERS_EXPLORER.map(provider => {
			// Filter GPU configs by search term
			const matchingGpus = provider.gpus.filter(gpu =>
				gpu.gpuModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
				provider.name.toLowerCase().includes(searchTerm.toLowerCase())
			);

			const matchesTab = activeTab === 'All' || provider.type === activeTab;
			const matchesSearch = searchTerm === '' ||
				provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				provider.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
				matchingGpus.length > 0;

			if (matchesTab && matchesSearch) {
				return {
					...provider,
					gpus: matchingGpus.length > 0 ? matchingGpus : provider.gpus
				};
			}
			return null;
		}).filter((p): p is CloudProviderDetail => p !== null);
	}, [searchTerm, activeTab]);

	return (
		<div className="space-y-6">
			{/* Filters Bar */}
			<div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
				<div className="flex flex-wrap gap-2">
					{(['All', 'Enterprise', 'Standard', 'Decentralized'] as const).map(tab => (
						<button
							key={tab}
							type="button"
							onClick={() => setActiveTab(tab)}
							className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
								activeTab === tab
									? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
									: 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 [.light_&]:bg-white [.light_&]:border-slate-200 [.light_&]:text-slate-600 [.light_&]:hover:text-slate-900'
							}`}
						>
							{tab}
						</button>
					))}
				</div>

				<div className="w-full sm:w-72 relative">
					<input
						type="text"
						placeholder="Search provider or GPU..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full pl-4 pr-10 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 [.light_&]:bg-white [.light_&]:border-slate-200 text-white [.light_&]:text-slate-800 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
					/>
					<span className="absolute right-3 top-3 text-slate-500 text-xs">🔍</span>
				</div>
			</div>

			{/* List layout of Providers */}
			<div className="space-y-8">
				{filteredProviders.length === 0 ? (
					<div className="text-center py-12 panel-soft rounded-2xl border border-slate-850">
						<p className="text-slate-500 text-sm">No GPU cloud services found matching your criteria.</p>
					</div>
				) : (
					filteredProviders.map(p => (
						<div key={p.id} className="panel-soft rounded-[2rem] border border-slate-850 bg-slate-900/30 p-6 lg:p-8 space-y-6 transition duration-200 hover:border-slate-800/80">
							{/* Provider header info */}
							<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
								<div className="space-y-2">
									<div className="flex items-center gap-3">
										<h4 className="text-xl font-bold text-white">{p.name}</h4>
										<span className={`text-[9px] uppercase tracking-widest font-mono font-bold px-2.5 py-0.5 rounded-full ${
											p.type === 'Enterprise'
												? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
												: p.type === 'Decentralized'
													? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
													: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
										}`}>
											{p.type}
										</span>
									</div>
									<p className="text-xs text-slate-400 max-w-3xl leading-5">{p.description}</p>
								</div>

								<a
									href={p.affiliateUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 hover:border-cyan-500/50 bg-cyan-950/20 rounded-xl transition"
								>
									{p.ctaText || 'Visit site →'}
								</a>
							</div>

							{/* Provider specs meta */}
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-slate-400">
								<div className="bg-slate-950/45 p-3.5 rounded-xl border border-slate-900">
									<span className="text-[10px] text-slate-500 uppercase tracking-wider block">Billing Unit</span>
									<span className="text-slate-200 mt-1 block">{p.billingUnit}</span>
								</div>
								<div className="bg-slate-950/45 p-3.5 rounded-xl border border-slate-900">
									<span className="text-[10px] text-slate-500 uppercase tracking-wider block">Network Egress</span>
									<span className="text-emerald-400 mt-1 block">{p.egress}</span>
								</div>
								<div className="bg-slate-950/45 p-3.5 rounded-xl border border-slate-900">
									<span className="text-[10px] text-slate-500 uppercase tracking-wider block">Storage Cost</span>
									<span className="text-cyan-400 mt-1 block">{p.storageCost}</span>
								</div>
							</div>

							{/* GPU Configs Table/List */}
							<div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/30">
								<table className="w-full text-left border-collapse min-w-[600px]">
									<thead>
										<tr className="border-b border-slate-800/80 bg-slate-950/50 text-[10px] font-mono uppercase tracking-wider text-slate-500">
											<th className="py-3 px-4">GPU Model</th>
											<th className="py-3 px-4">VRAM</th>
											<th className="py-3 px-4 text-right">Rate ($/hr)</th>
											<th className="py-3 px-4 text-center">Alternatives / Spot</th>
											<th className="py-3 px-4 text-right">Compare</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-800/40 text-xs font-mono">
										{p.gpus.map((gpu) => {
											const presetId = `${p.id}-${gpu.gpuModel.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
											const isCurrentlySelected = selectedPresetId === presetId;

											return (
												<tr key={gpu.gpuModel} className={`hover:bg-slate-900/30 transition ${isCurrentlySelected ? 'bg-cyan-500/5' : ''}`}>
													<td className="py-3.5 px-4 font-semibold text-slate-200">{gpu.gpuModel}</td>
													<td className="py-3.5 px-4 text-slate-400">{gpu.vram}</td>
													<td className="py-3.5 px-4 text-right text-cyan-400 font-bold">
														${gpu.rate.toFixed(2)}/hr
													</td>
													<td className="py-3.5 px-4 text-center text-slate-500 text-[10px]">
														{gpu.spotRate ? (
															<span className="text-amber-400">Spot: ${gpu.spotRate.toFixed(2)}/hr</span>
														) : gpu.communityRate ? (
															<span className="text-indigo-400">P2P: ${gpu.communityRate.toFixed(2)}/hr</span>
														) : gpu.note ? (
															<span>{gpu.note}</span>
														) : (
															'—'
														)}
													</td>
													<td className="py-3.5 px-4 text-right">
														<button
															type="button"
															onClick={() => onSelectPreset(presetId)}
															className={`px-3 py-1.5 rounded-lg font-bold text-[10px] transition cursor-pointer ${
																isCurrentlySelected
																	? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.15)]'
																	: 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/10'
															}`}
														>
															{isCurrentlySelected ? 'Selected' : 'Compare'}
														</button>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
