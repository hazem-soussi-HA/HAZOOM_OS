export const devSecOpsProjects = [
  {
    title: "HA-Zoom K8s Operator",
    tech: "Go / Kubernetes / Controller-Runtime",
    description: "Custom K8s Operator for automated lifecycle management of high-availability instances. Implements reconciliation loops and custom status subresources.",
    link: "https://github.com/hazem-soussi-HA/ha-zoom-operator",
    securityStatus: "Audited",
    lastScan: "2024-05-12"
  },
  {
    title: "Circuit-Scan Security Engine",
    tech: "Python / Static Analysis / CVE-DB",
    description: "Binary analysis tool for identifying infrastructure vulnerabilities. Integrated into CI/CD pipelines to block non-compliant container images.",
    link: "https://github.com/hazem-soussi-HA/circuit-scan",
    securityStatus: "Hardened",
    lastScan: "2024-05-11"
  },
  {
    title: "Pascal Encrypted Vault",
    tech: "Rust / AES-256 / Zero-Knowledge",
    description: "Zero-knowledge secret management system for high-security environments. Features TPM-backed key storage and audit logging.",
    link: "https://github.com/hazem-soussi-HA/pascal_vault",
    securityStatus: "Encrypted",
    lastScan: "2024-05-10"
  }
];