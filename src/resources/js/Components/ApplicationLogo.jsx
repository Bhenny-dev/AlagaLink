export default function ApplicationLogo({ className = '', ...props }) {
    return (
        <svg
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className={className}
            {...props}
        >
            <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                fill="currentColor"
                d="M24 12L14 36h5l2-6h6l2 6h5L24 12zm-2 14l2-6 2 6h-4z"
            />
        </svg>
    );
}
