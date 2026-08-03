import React, { useState, useRef, useEffect } from 'react';

interface TerminalPanelProps {
	onCommand: (cmd: string) => { output: string; success: boolean };
}

interface LogLine {
	text: string;
	type: 'input' | 'output' | 'error' | 'system';
}

export default function TerminalPanel({ onCommand }: TerminalPanelProps) {
	const [input, setInput] = useState('');
	const [history, setHistory] = useState<LogLine[]>([
		{ text: 'Loh-Friction Wealth Orchestrator CLI v1.0.0', type: 'system' },
		{ text: 'Type "help" to view syntax rules and available commands.', type: 'system' }
	]);
	const terminalEndRef = useRef<HTMLDivElement>(null);

	const scrollToEnd = () => {
		terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToEnd();
	}, [history]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedInput = input.trim();
		if (!trimmedInput) return;

		const nextHistory = [...history, { text: `> ${trimmedInput}`, type: 'input' as const }];
		
		if (trimmedInput.toLowerCase() === 'clear') {
			setHistory([]);
			setInput('');
			return;
		}

		// Process command
		const result = onCommand(trimmedInput);
		
		setHistory([
			...nextHistory,
			{ 
				text: result.output, 
				type: result.success ? 'output' as const : 'error' as const 
			}
		]);
		setInput('');
	};

	return (
		<div className="flex flex-col h-[320px] rounded-2xl border border-gray-200 bg-white/90 font-mono text-xs shadow-2xl overflow-hidden">
			{/* Header */}
			<div className="h-9 border-b border-gray-200 bg-slate-900/60 flex items-center px-4 justify-between">
				<div className="flex items-center gap-1.5">
					<div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
					<div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
					<div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
					<span className="ml-2 text-[#5E5E5E] text-[10px] tracking-wider uppercase font-semibold">Orchestrator_CLI</span>
				</div>
				<span className="text-[9px] text-[#8C8C8C] font-mono">STATUS: ACTIVE</span>
			</div>

			{/* Terminal body */}
			<div className="flex-1 p-4 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
				{history.map((line, idx) => {
					let textColor = 'text-[#5E5E5E]';
					if (line.type === 'input') textColor = 'text-[#5A7A8F]';
					if (line.type === 'error') textColor = 'text-[#B85C5C]';
					if (line.type === 'system') textColor = '#1A1A1A/90';
					if (line.type === 'output') textColor = 'text-[#5E5E5E]';

					return (
						<div key={idx} className={`${textColor} whitespace-pre-wrap leading-relaxed`}>
							{line.text}
						</div>
					);
				})}
				<div ref={terminalEndRef} />
			</div>

			{/* Form input */}
			<form onSubmit={handleSubmit} className="border-t border-gray-200 bg-slate-900/40 p-3 flex gap-2">
				<span className="text-[#5A7A8F] font-bold select-none">$</span>
				<input
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Enter money command (e.g. Checking [2500] HYSA)..."
					className="flex-1 bg-transparent text-[#5E5E5E] border-none outline-none focus:ring-0 p-0 text-xs placeholder:text-[#8C8C8C]"
				/>
				<button type="submit" className="px-3 py-1 bg-gray-200 hover:bg-slate-700 text-[#5E5E5E] font-semibold rounded text-[10px] uppercase tracking-wider transition">
					Execute
				</button>
			</form>
		</div>
	);
}
