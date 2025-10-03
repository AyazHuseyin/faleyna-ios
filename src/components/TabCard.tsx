// TabCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';

type TabCardProps = {
  name: string;
  motto?: string;
  description?: string;
  image?: string | ImageSourcePropType;
  onPress?: () => void;
  pressable?: boolean;
  variant?: 'advisor' | 'fortune';
  price?: number;
  detail?: string;
  detailOnPress?: () => void;
  showBadge?: boolean;
};

export default function TabCard({
  name,
  motto,
  description,
  image,
  onPress,
  pressable = true,
  variant = 'advisor',
  price,
  detail = undefined,
  detailOnPress = undefined,
  showBadge = false,
}: TabCardProps) {
  const Wrapper: any = pressable ? TouchableOpacity : View;
  const isRemoteImage = typeof image === 'string';

  return (
    <Wrapper
      onPress={pressable ? onPress : undefined}
      activeOpacity={0.8}
      style={[
        styles.card,
        variant === 'fortune' && styles.fortuneCard,
        showBadge && styles.unreadCard,
      ]}
    >
      {showBadge && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>YENİ</Text>
        </View>
      )}

      {variant === 'fortune' ? (
        <>
          {image ? (
            <Image
              source={isRemoteImage ? { uri: image } : image}
              style={styles.fortuneImage}
              resizeMode="cover"
            />
          ) : null}
          <Text style={styles.fortuneName}>{name}</Text>
          {description ? <Text style={styles.fortuneDesc}>{description}</Text> : null}
          {price != null && (
            <View style={styles.priceCard}>
              <Image
                source={require('../assets/images/bakiye.png')}
                style={styles.bakiyeImage}
                resizeMode="contain"
              />
              <Text style={styles.price}>{price} kredi</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.cardContent}>
          {image ? (
            <View style={styles.avatarCard}>
              <Image
                source={isRemoteImage ? { uri: image } : image}
                style={styles.avatar}
                resizeMode="cover"
              />
            </View>
          ) : null}
          <View style={styles.textBlock}>
            <Text style={styles.name}>{name}</Text>
            {motto ? <Text style={styles.motto}>{motto}</Text> : null}
            {description ? <Text style={styles.description}>{description}</Text> : null}

            {detail && (
              <TouchableOpacity style={styles.detailContainer} onPress={detailOnPress}>
                <Text style={styles.detailText}>{detail}</Text>
              </TouchableOpacity>
            )}

            {price != null && (
              <View style={styles.priceCard}>
                <Image
                  source={require('../assets/images/bakiye.png')}
                  style={styles.bakiyeImage}
                  resizeMode="contain"
                />
                <Text style={styles.price}>{price} Ametist Taşı</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FAEFE6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    position: 'relative',
  },
  unreadCard: {
    backgroundColor: '#FAEFE6',
    borderColor: '#5f3d9f',
    borderWidth: 1,
    shadowColor: '#5f3d9f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#e67e22',
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCard: {
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
    width: 100,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  textBlock: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    color: '#e7a96a',
    fontWeight: 'bold',
  },
  motto: {
    fontSize: 14,
    color: '#351a75',
    fontStyle: 'italic',
    marginTop: 4,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#351a75',
    marginTop: 6,
  },
  detailContainer: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  detailText: {
    fontSize: 15,
    color: '#5f3d9f',
    fontWeight: 'bold',
  },
  fortuneCard: {
    alignItems: 'center',
  },
  fortuneImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#ccc',
  },
  fortuneName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5f3d9f',
  },
  fortuneDesc: {
    fontSize: 14,
    color: '#351a75',
    textAlign: 'center',
    marginTop: 6,
  },
  priceCard: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
  },
  bakiyeImage: {
    width: 30,
    height: 25,
  },
  price: {
    marginLeft: 3,
    fontSize: 16,
    color: '#5f3d9f',
    fontWeight: 'bold',
  },
});
