import { View, Text, TouchableOpacity, TextInput, Modal, FlatList, ScrollView } from 'react-native';
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
                className="border border-gray-300 rounded-xl p-4 bg-white flex-row items-center justify-between"
            >
                <View className="flex-row items-center flex-1">
                    {selectedCountryData ? (
                        <>
                            <Text className="text-2xl mr-2">{selectedCountryData.flag}</Text>
                            <Text className="text-gray-800 text-base">{selectedCountryData.name}</Text>
                        </>
                    ) : (
                        <Text className="text-gray-400 text-base">{placeholder}</Text>
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
                <View className="flex-1 bg-black/50">
                    <View className="flex-1 mt-20 bg-white rounded-t-3xl">
                        {/* Header */}
                        <View className="p-4 border-b border-gray-200 flex-row items-center justify-between">
                            <Text className="text-xl font-bold text-gray-800">Select Country</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} className="p-2">
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Search Bar */}
                        <View className="p-4 border-b border-gray-100">
                            <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                                <Search size={20} color="#9ca3af" />
                                <TextInput
                                    className="flex-1 ml-2 text-base text-gray-800"
                                    placeholder="Search countries..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoFocus
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <X size={18} color="#9ca3af" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Country List */}
                        <FlatList
                            data={filteredCountries}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => handleSelect(item.name)}
                                    className={`px-4 py-4 border-b border-gray-50 flex-row items-center ${item.name === selectedCountry ? 'bg-terracotta/10' : ''
                                        }`}
                                >
                                    <Text className="text-2xl mr-3">{item.flag}</Text>
                                    <Text className={`text-base ${item.name === selectedCountry ? 'text-terracotta font-semibold' : 'text-gray-800'}`}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View className="p-8 items-center">
                                    <Text className="text-gray-400 text-center">No countries found</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </>
    );
}
