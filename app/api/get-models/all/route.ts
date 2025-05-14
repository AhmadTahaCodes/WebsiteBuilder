import { NextResponse } from 'next/server';
import { getAvailableProviders } from '@/lib/providers/config';
import { createProviderClient } from '@/lib/providers/provider';

// GET /api/get-models/all - returns all models grouped by provider
export async function GET() {
  try {
    const providers = getAvailableProviders();
    const result = [];
    for (const provider of providers) {
      try {
        const providerClient = createProviderClient(provider.id);
        let models = await providerClient.getModels();
        // Special handling for OpenRouter: group models by company/organization
        if (provider.id === 'openrouter') {
          // Fetch full model metadata from OpenRouter API
          const apiKey = process.env.OPENROUTER_API_KEY;
          const res = await fetch('https://openrouter.ai/api/v1/models', {
            headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {},
          });
          const data = await res.json();
          if (Array.isArray(data.data)) {
            // Group models by organization/company
            const companyMap: Record<string, any[]> = {};
            for (const model of data.data) {
              // Try to get company/organization/provider name
              const company =
                model.organization ||
                model.provider ||
                (model.id && model.id.split('/')[0]) ||
                'Other';
              if (!companyMap[company]) companyMap[company] = [];
              companyMap[company].push({
                id: model.id,
                name: model.name || model.id,
                description: model.description || '',
              });
            }
            // Push each company as a group under OpenRouter
            for (const company in companyMap) {
              result.push({
                provider: {
                  id: provider.id,
                  name: `OpenRouter (${company})`,
                  description: `Models by ${company} via OpenRouter`,
                  isLocal: false,
                  company,
                },
                models: companyMap[company],
              });
            }
            continue; // Skip default push for OpenRouter
          }
        }
        // Default: push as a single group
        result.push({
          provider: {
            id: provider.id,
            name: provider.name,
            description: provider.description,
            isLocal: provider.isLocal,
            examples: provider.examples || [],
          },
          models,
        });
      } catch (err) {
        // If a provider fails, skip it but log the error
        console.error(`Error fetching models for provider ${provider.id}:`, err);
      }
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching all models:', error);
    return NextResponse.json(
      { error: 'Error fetching all models' },
      { status: 500 }
    );
  }
}
