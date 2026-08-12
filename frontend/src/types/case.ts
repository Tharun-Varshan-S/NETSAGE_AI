export interface Case {
    id: number;
    symptom: string;
    topology_note: string;
    show_outputs: string;
    expected_fault: string;
    osi_layer: string;
    concept_tag: string;
    severity: string;
    ai_root_cause?: string;
    ai_confidence?: string;
    ai_evidence?: string;
    ai_next_command?: string;
    ai_fix_steps?: string;
    review?: {
        status: string;
        reason: string;
    };
}
