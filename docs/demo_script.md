# NetSage AI: Demo Script

**Target Length**: 5 - 10 minutes

## 1. Introduction (1 min)
- **Visual**: Start on the Case Queue screen.
- **Script**: "Welcome to NetSage AI. Our team built this tool to help junior network engineers troubleshoot Packet Tracer labs. When engineers struggle to connect symptoms to root causes, NetSage uses AI to suggest a fix. But crucially, our Safety Rule enforces that a human reviewer must approve every AI diagnosis."

## 2. The Case Queue & Deterministic Checks (2 mins)
- **Visual**: Scroll through the queue showing different case severities and types.
- **Script**: "Here we see our dataset of lab issues. Before the AI even sees the case, we run a deterministic Python rule checker. Let's run it from the CLI to demonstrate."
- **Action**: Open terminal and run `python backend/scripts/run_rule_checker.py --file example.txt` (assuming an example file exists with duplicate IPs).
- **Script**: "As you can see, our rule checker instantly caught a duplicate IP issue. This ensures basic config errors are caught deterministically."

## 3. AI Diagnosis & Human Review Flow (3 mins)
- **Visual**: Click into an unresolved case in the Case Queue (e.g., VLAN 30 reachability issue).
- **Script**: "Let's review a pending case. The symptom is that a PC gets an IP but can't reach the server on VLAN 30. We can see the raw show command outputs here."
- **Action**: Click "Run AI Analysis". Wait for the diagnosis to populate.
- **Script**: "NetSage's AI (using Gemini) analyzes the show outputs. It correctly identifies the root cause as an inter-VLAN routing issue, provides a confidence score, quotes the exact evidence, and suggests the next commands to run (`show ip route`)."
- **Action**: Type a reason in the review box: "Good analysis, but missing the trunk check." Click "Edit".
- **Script**: "As a senior reviewer, I think this is mostly correct, but I want to add that they need to check the trunk ports. I'll mark this as 'Edited' and save."

## 4. Dashboard & Responsible AI Log (2 mins)
- **Visual**: Click over to the Dashboard view.
- **Script**: "Once cases are reviewed, our Dashboard updates in real time. We can see the breakdown of issues by category and severity."
- **Action**: Point to the "AI Agreement Rate".
- **Script**: "Most importantly, we track the AI Agreement Rate. This tells us how often the human reviewer accepted the AI's answer without changes."
- **Action**: Show the `responsible_ai_log.md` file or run the generation script.
- **Script**: "Because we logged the case we just edited, it automatically gets added to our Responsible AI Log, fulfilling our safety requirements by tracking exactly when and why the AI was corrected."

## 5. Conclusion (1 min)
- **Script**: "NetSage AI successfully bridges the gap between raw command outputs and root cause analysis, all while keeping a human in the loop for safety and accuracy. Thank you."
