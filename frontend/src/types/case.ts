export interface Review {
    id: number;
    case_id: number;
    status: 'Accepted' | 'Edited' | 'Rejected';
    reason?: string;
    created_at: string;
}

export interface Case {
    id: number;
    case_id: string;
    category: string;
    difficulty: string;
    diagnosis_type: string;
    symptom: string;
    topology_note: string;
    show_outputs: string;
    expected_fault: string;
    osi_layer: string;
    concept_tag: string;
    severity: string;
    expected_next_command?: string;
    expected_fix?: string;
    verification_command?: string;
    
    // AI Diagnosis results
    ai_root_cause?: string;
    ai_osi_layer?: string;
    ai_confidence?: string;
    ai_evidence?: string;
    ai_reason?: string;
    ai_next_command?: string;
    ai_fix_steps?: string;
    ai_verification_command?: string;
    
    // Stateful fields
    diagnosis_status?: 'NEEDS_INFO' | 'DIAGNOSED' | 'PENDING_REVIEW' | 'VERIFICATION_REQUIRED' | 'RESOLVED' | 'NOT_RESOLVED' | 'REJECTED';
    
    // Optional review from relationships
    review?: Review;
}

export interface RuleFinding {
    rule: string;
    status: 'DETECTED' | 'NOT_DETECTED' | 'INSUFFICIENT_EVIDENCE' | 'NOT_APPLICABLE';
    evidence?: string[] | string;
    [key: string]: any;
}

export interface DiagnosisResponse {
    status: 'NEEDS_INFO' | 'DIAGNOSED' | 'VERIFICATION_REQUIRED' | 'RESOLVED' | 'NOT_RESOLVED';
    root_cause?: string;
    osi_layer?: string;
    confidence?: string;
    evidence?: string;
    reason?: string;
    next_command?: string;
    fix_steps?: string;
    verification_command?: string;
    rule_findings?: RuleFinding[];
}

export interface DashboardStats {
    issues_by_type: { name: string; value: number }[];
    issues_by_severity: { name: string; value: number }[];
    review_stats: {
        total_reviews: number;
        accepted: number;
        edited: number;
        rejected: number;
        agreement_rate: number;
    };
}

