import { supabase } from '../lib/supabase';

interface EquipmentData {
  primary_equipment: string;
}

export async function getAvailableEquipment(): Promise<string[]> {
  try {
    // First, let's get a count of all distinct equipment
    const { data: distinctCount } = await supabase
      .from('exercises')
      .select('primary_equipment')
      .not('primary_equipment', 'is', null)
      .not('primary_equipment', 'eq', '')
      .select('primary_equipment', { count: 'exact', head: false });
    
    console.log('Distinct equipment count:', distinctCount);

    // Now get the actual equipment with counts
    const { data, error } = await supabase.rpc('get_equipment_counts');
    
    if (error) {
      console.error('Error fetching equipment:', error);
      throw error;
    }

    console.log('Equipment with counts:', data);

    if (!data?.length) {
      return [];
    }

    return data
      .map(item => item.primary_equipment)
      .filter(Boolean)
      .map(equipment => equipment.trim())
      .map(equipment => equipment
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
      )
      .sort((a, b) => a.localeCompare(b));

  } catch (error) {
    console.error('Error in getAvailableEquipment:', error);
    return [];
  }
}