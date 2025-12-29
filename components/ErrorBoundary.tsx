import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertTriangle } from 'lucide-react-native';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary to catch and handle React errors gracefully
 * Prevents the entire app from crashing when a component throws an error
 */
export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console in development
        console.error('Error Boundary caught an error:', error, errorInfo);

        // In production, you would send this to an error tracking service
        // Example: Sentry.captureException(error, { extra: errorInfo });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <LinearGradient
                    colors={['#fffbf0', '#fff1f2', '#f0f9ff']}
                    style={styles.container}
                >
                    <View style={styles.content}>
                        <View style={styles.iconContainer}>
                            <AlertTriangle size={64} color="#ef4444" />
                        </View>

                        <Text style={styles.title}>Oops! Something went wrong</Text>

                        <Text style={styles.message}>
                            We're sorry for the inconvenience. The app encountered an unexpected error.
                        </Text>

                        {__DEV__ && this.state.error && (
                            <View style={styles.errorDetails}>
                                <Text style={styles.errorText}>
                                    {this.state.error.toString()}
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            onPress={this.handleReset}
                            style={styles.button}
                        >
                            <Text style={styles.buttonText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        alignItems: 'center',
        maxWidth: 400,
    },
    iconContainer: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    errorDetails: {
        backgroundColor: '#fee2e2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
        width: '100%',
    },
    errorText: {
        fontSize: 12,
        color: '#dc2626',
        fontFamily: 'monospace',
    },
    button: {
        backgroundColor: '#e07a5f',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
