import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Colors from '@theme/colors';
import PropTypes from 'prop-types';

const styles = StyleSheet.create({
  wrapper: {
    height: 75,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.darkGray,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    height: 48,
    width: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  text: {
    color: Colors.text.white,
  },
  bold: {
    fontWeight: 'bold',
  },
});

const AppNotification = ({ image, name, message, style, handleClose }) => {
  if (message === '') {
    return null;
  }

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.content}>
        <Image source={{ uri: image }} style={styles.image} />
        <View>
          {
            name && <Text style={[styles.text, styles.bold]}>{name}</Text>
          }
          <Text style={styles.text}>{message}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={handleClose}>
        <Icon
          name="ios-close"
          size={45}
          style={{ color: '#fff' }}
        />
      </TouchableOpacity>
    </View>
  );
};

AppNotification.propTypes = {
  image: PropTypes.string,
  name: PropTypes.string,
  message: PropTypes.string.isRequired,
  style: View.propTypes.style,
  handleClose: PropTypes.func,
};

AppNotification.defaultProps = {
  image: '',
  name: '',
  style: {},
  handleClose: () => { },
};

export default AppNotification;