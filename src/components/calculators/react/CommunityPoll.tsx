import React, { useState, useEffect } from 'react';

interface Props {
	occupationCode: string;
}

export default function CommunityPoll({ occupationCode }: Props) {
	const [hasVoted, setHasVoted] = useState(false);
	const [userChoice, setUserChoice] = useState<'agree' | 'disagree' | null>(null);
	
	// Mock vote counts (using local storage to simulate persistence)
	const [agreeCount, setAgreeCount] = useState(72);
	const [disagreeCount, setDisagreeCount] = useState(28);

	useEffect(() => {
		const savedVote = localStorage.getItem(`poll_voted_${occupationCode}`);
		if (savedVote === 'agree' || savedVote === 'disagree') {
			setHasVoted(true);
			setUserChoice(savedVote as 'agree' | 'disagree');
			
			// Adjust mock stats if user already voted
			if (savedVote === 'agree') {
				setAgreeCount(73);
				setDisagreeCount(27);
			} else {
				setAgreeCount(71);
				setDisagreeCount(29);
			}
		}
	}, [occupationCode]);

	const handleVote = (vote: 'agree' | 'disagree') => {
		localStorage.setItem(`poll_voted_${occupationCode}`, vote);
		setHasVoted(true);
		setUserChoice(vote);
		if (vote === 'agree') {
			setAgreeCount(agreeCount + 1);
		} else {
			setDisagreeCount(disagreeCount + 1);
		}
	};

	const total = agreeCount + disagreeCount;
	const agreePct = Math.round((agreeCount / total) * 100);
	const disagreePct = 100 - agreePct;

	return (
		<div class="mt-4 rounded-2xl border border-white/5 bg-slate-900/30 p-4">
			{!hasVoted ? (
				<div class="space-y-4">
					<p class="text-sm leading-6 text-slate-300">
						Do you agree with the AI automation risk score calculated for this occupation?
					</p>
					<div class="flex gap-3">
						<button
							onClick={() => handleVote('agree')}
							class="flex-1 rounded-xl border border-cyan-500/30 bg-cyan-950/20 py-2.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500 hover:text-slate-950"
						>
							Yes, accurate
						</button>
						<button
							onClick={() => handleVote('disagree')}
							class="flex-1 rounded-xl border border-red-500/30 bg-red-950/20 py-2.5 text-xs font-semibold text-red-300 transition hover:bg-red-500 hover:text-slate-950"
						>
							No, off target
						</button>
					</div>
				</div>
			) : (
				<div class="space-y-4">
					<p class="text-xs font-mono tracking-wider uppercase text-slate-400">Poll Results</p>
					
					<div class="space-y-3">
						<div>
							<div class="flex justify-between text-xs text-slate-300">
								<span class="font-medium">Accurate Risk Rating</span>
								<span class="font-mono">{agreePct}%</span>
							</div>
							<div class="mt-1.5 h-1.5 w-full rounded-full bg-slate-800">
								<div class="h-full rounded-full bg-cyan-500" style={{ width: `${agreePct}%` }}></div>
							</div>
						</div>
						
						<div>
							<div class="flex justify-between text-xs text-slate-300">
								<span class="font-medium">Off Target</span>
								<span class="font-mono">{disagreePct}%</span>
							</div>
							<div class="mt-1.5 h-1.5 w-full rounded-full bg-slate-800">
								<div class="h-full rounded-full bg-red-500" style={{ width: `${disagreePct}%` }}></div>
							</div>
						</div>
					</div>

					<p class="text-[0.7rem] italic text-slate-500 text-center">
						You voted: {userChoice === 'agree' ? 'Accurate' : 'Off Target'}. Thanks for participating!
					</p>
				</div>
			)}
		</div>
	);
}
