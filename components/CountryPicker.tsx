import { View, Text, TouchableOpacity, TextInput, Modal, FlatList } from 'react-native';
import { useState } from 'react';
import { Search, ChevronDown, X } from 'lucide-react-native';

interface Country {
    name: string;
    code: string;
    flag: string;
}

interface CountryPickerProps {
    countries: Country[];
    selectedCountry: string;
    onSelect: (country: string) => void;
    placeholder?: string;
}

export default function CountryPicker({ countries, selectedCountry, onSelect, placeholder = 'Select country' }: CountryPickerProps) {
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCountries = countries.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (countryName: string) => {
        onSelect(countryName);
        setModalVisible(false);
        setSearchQuery('');
    };

    const selectedCountryData = countries.find(c => c.name === selectedCountry);

    return (
        <>
            {/* Trigger Button */}
            <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={{
                    height: 50,
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    backgroundColor: 'white',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    {selectedCountryData ? (
                        <>
                            <Text style={{ fontSize: 24, marginRight: 8 }}>{selectedCountryData.flag}</Text>
                            <Text style={{ fontSize: 16, color: '#1f2937' }}>{selectedCountryData.name}</Text>
                        </>
                    ) : (
                        <Text style={{ fontSize: 16, color: '#9ca3af' }}>{placeholder}</Text>
                    )}
                </View>
                <ChevronDown size={20} color="#9ca3af" />
            </TouchableOpacity>

            {/* Modal with country list */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ height: '90%', backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }}>

                        {/* Header - Added padding top for spacing */}
                        <View style={{ padding: 20, paddingTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937' }}>Select Country</Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={{ padding: 8, backgroundColor: '#f3f4f6', borderRadius: 20 }}
                            >
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Search Bar */}
                        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 }}>
                                <Search size={20} color="#9ca3af" />
                                <TextInput
                                    style={{ flex: 1, marginLeft: 10, fontSize: 16, color: '#1f2937' }}
                                    placeholder="Search countries..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoFocus
                                    placeholderTextColor="#9ca3af"
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <X size={18} color="#9ca3af" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Country List - Increased item padding */}
                        <FlatList
                            data={filteredCountries}
                            keyExtractor={(item) => item.code}
                            contentContainerStyle={{ paddingBottom: 40 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => handleSelect(item.name)}
                                    style={{
                                        paddingHorizontal: 20,
                                        paddingVertical: 16, // Increased padding
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#f9fafb',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: item.name === selectedCountry ? 'rgba(224, 122, 95, 0.1)' : 'white'
                                    }}
                                >
                                    <Text style={{ fontSize: 28, marginRight: 16 }}>{item.flag}</Text>
                                    <Text style={{
                                        fontSize: 16,
                                        color: item.name === selectedCountry ? '#e07a5f' : '#1f2937',
                                        fontWeight: item.name === selectedCountry ? '600' : '400'
                                    }}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={{ padding: 32, alignItems: 'center' }}>
                                    <Text style={{ color: '#9ca3af', textAlign: 'center' }}>No countries found</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </>
    );
}
