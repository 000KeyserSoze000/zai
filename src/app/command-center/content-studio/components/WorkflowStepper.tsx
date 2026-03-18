"use client"

import { Check, FileText, Search, Palette, ImageIcon, Share2, Send } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

interface WorkflowStepperProps {
    currentStepIndex: number
    isPublished: boolean
}

const STEP_ICONS = [FileText, Search, Palette, ImageIcon, Share2, Send]
const STEP_IDS = ['context', 'metadata', 'artistic', 'thumbnails', 'social', 'publish']

export function WorkflowStepper({ currentStepIndex, isPublished }: WorkflowStepperProps) {
    const { t } = useTranslation()

    const steps = STEP_IDS.map((id, index) => ({
        id,
        name: t(`contentStudio.steps.${id}`),
        description: t(`contentStudio.steps.${id}Desc`),
        icon: STEP_ICONS[index]
    }))

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                {steps.map((step, index) => {
                    const Icon = step.icon
                    const isCompleted = index < currentStepIndex || (step.id === 'publish' && isPublished)
                    const isActive = !isCompleted && index === currentStepIndex

                    return (
                        <div key={step.id} className="flex items-center">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCompleted
                                            ? 'bg-green-500 text-white'
                                            : isActive
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                                        }`}
                                >
                                    {isCompleted ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <Icon className="w-5 h-5" />
                                    )}
                                </div>
                                <div className="mt-2 text-center">
                                    <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-neutral-500'}`}>
                                        {step.name}
                                    </p>
                                    <p className="text-xs text-neutral-600 hidden md:block">{step.description}</p>
                                </div>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`w-16 md:w-24 h-0.5 mx-2 ${(index < currentStepIndex || (step.id === 'publish' && isPublished)) ? 'bg-green-500' : 'bg-neutral-700'
                                    }`} />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
